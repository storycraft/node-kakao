import { PacketLoginRes, PacketLoginReq } from "../packet/packet-login";
import { LocoClient } from "../client";
import { LocoInterface, LocoReceiver } from "../loco/loco-interface";
import { PacketPingReq } from "../packet/packet-ping";
import { TalkPacketHandler } from "./packet-handler";
import { Socket } from "net";
import { PacketCheckInReq, PacketCheckInRes } from "../packet/packet-check-in";
import { PacketGetConfReq, PacketGetConfRes } from "../packet/packet-get-conf";
import { StatusCode, LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { LocoPacketWriter, LocoPacketReader, LocoPacketHandler, LocoTLSSocket, LocoSecureSocket, Long, LocoPacketList, PacketHeader, KakaoAPI } from "..";
import { LocoSocket } from "./loco-socket";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class NetworkManager implements LocoInterface, LocoReceiver {

    public static readonly PING_INTERVAL = 600000;

    private currentSocket: LocoSocket | null;

    private locoConnected: boolean;
    private locoLogon: boolean;

    private packetWriter: LocoPacketWriter;
    private packetReader: LocoPacketReader;
    
    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private lastCheckinReq: number;

    private packetMap: Map<number, LocoRequestPacket>;

    private handler: LocoPacketHandler;

    private pingSchedulerId: NodeJS.Timeout | null;

    constructor(private client: LocoClient, packetWriter: LocoPacketWriter = new LocoPacketWriter(), packetReader: LocoPacketReader = new LocoPacketReader()) {
        this.packetMap = new Map();
        
        this.pingSchedulerId = null;

        this.handler = this.createPacketHandler();

        this.locoConnected = false;
        this.locoLogon = false;

        this.cachedBookingData = null;
        this.cachedCheckinData = null;
        this.lastCheckinReq = -1;

        this.currentSocket = null;

        this.packetWriter = packetWriter;
        this.packetReader = packetReader;
    }

    protected createPacketHandler() {
        return new TalkPacketHandler(this);
    }

    get CurrentSocket() {
        return this.currentSocket;
    }

    get Writer() {
        return this.packetWriter;
    }

    get Reader() {
        return this.packetReader;
    }

    get Handler() {
        return this.handler;
    }

    set Handler(handler) {
        this.handler = handler;
    }

    get Client() {
        return this.client;
    }

    get Connected() {
        return this.locoConnected;
    }

    get Logon() {
        return this.locoLogon;
    }

    protected createBookingSocket(receiver: LocoReceiver, hostInfo: HostData): LocoSocket {
        return new LocoTLSSocket(receiver, hostInfo.Host, hostInfo.Port, false);
    }

    protected createCheckinSocket(receiver: LocoReceiver, hostInfo: HostData): LocoSocket {
        return new LocoSecureSocket(receiver, hostInfo.Host, hostInfo.Port, false);
    }

    protected createLocoSocket(receiver: LocoReceiver, hostInfo: HostData): LocoSocket {
        return new LocoSecureSocket(receiver, hostInfo.Host, hostInfo.Port, true);
    }

    protected async fetchCheckinData(checkinHost: HostData, userId: Long): Promise<CheckinData> {
        let socket = this.createCheckinSocket({
            responseReceived: this.responseReceived.bind(this),
            disconnected: () => {}
        }, checkinHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to checkin server');
        }

        let packet = new PacketCheckInReq(userId);

        let ticket = packet.submitResponseTicket<PacketCheckInRes>();

        let packetId = this.packetWriter.getNextPacketId();

        socket.sendBuffer(this.packetWriter.toBuffer({ packetId: packetId, statusCode: 0, packetName: packet.PacketName, bodyType: 0, bodySize: 0 }, packet));
        this.packetMap.set(packetId, packet);

        let res = await ticket;

        if (res.StatusCode !== StatusCode.SUCCESS) throw res.StatusCode;

        return new CheckinData(new HostData(res.Host, res.Port), res.CacheExpire);
    }

    protected async fetchBookingData(bookingHost: HostData = HostData.BookingHost): Promise<BookingData> {
        let socket = this.createBookingSocket({
            responseReceived: this.responseReceived.bind(this),
            disconnected: () => {}
        }, bookingHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to booking server');
        }

        let packet = new PacketGetConfReq();
        let ticket = packet.submitResponseTicket<PacketGetConfRes>();

        let packetId = this.packetWriter.getNextPacketId();

        socket.sendBuffer(this.packetWriter.toBuffer({ packetId: packetId, statusCode: 0, packetName: packet.PacketName, bodyType: 0, bodySize: 0 }, packet));
        this.packetMap.set(packetId, packet);

        let res = await ticket;

        if (res.StatusCode !== StatusCode.SUCCESS) throw res.StatusCode;
        
        if (res.HostList.length < 1 && res.PortList.length < 1) {
            throw new Error(`No server avaliable`);
        }

        return new BookingData(new HostData(res.HostList[0], res.PortList[0]));
    }

    async getBookingData(forceRecache: boolean = false): Promise<BookingData> {
        if (!this.cachedBookingData || forceRecache) {
            try {
                this.cachedBookingData = await this.fetchBookingData();
            } catch (statusCode) {
                throw new Error(`Booking failed. code: ${statusCode}`);
            }
        }

        return this.cachedBookingData;
    }

    async getCheckinData(userId: Long, forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.lastCheckinReq < Date.now() || forceRecache) {
            try {
                this.cachedCheckinData = await this.fetchCheckinData((await this.getBookingData()).CheckinHost, userId);
                this.lastCheckinReq = Date.now();
            } catch (statusCode) {
                throw new Error(`Checkin failed. code: ${statusCode}`);
            }
        }

        return this.cachedCheckinData;
    }

    async locoLogin(deviceUUID: string, userId: Long, accessToken: string): Promise<PacketLoginRes> {
        if (this.Logon) {
            throw new Error('Already logon to loco');
        }
        
        let checkinData = await this.getCheckinData(userId);

        await this.connectToLoco(checkinData.LocoHost);

        let res = await this.loginToLoco(deviceUUID, accessToken);
        
        this.locoLogon = true;

        return res;
    }

    protected async connectToLoco(locoHost: HostData): Promise<boolean> {
        this.currentSocket = this.createLocoSocket(this, locoHost);

        this.locoConnected = await this.currentSocket.connect();

        if (!this.locoConnected) {
            throw new Error('Cannot connect to LOCO server');
        }

        return true;
    }

    async loginToLoco(deviceUUID: string, accessToken: string): Promise<PacketLoginRes> {
        if (!this.locoConnected) {
            throw new Error('Not connected to LOCO');
        }

        if (this.locoLogon) {
            throw new Error('Already logon to LOCO');
        }

        let packet = new PacketLoginReq(deviceUUID, accessToken);

        let res = await this.requestPacketRes<PacketLoginRes>(packet);

        this.locoLogon = true;
        this.schedulePing();

        return res;
    }

    private schedulePing() {
        if (!this.locoConnected) {
            return;
        }

        this.pingSchedulerId = setTimeout(this.schedulePing.bind(this), NetworkManager.PING_INTERVAL);

        this.sendPacket(new PacketPingReq());
    }

    async disconnect() {
        if (!this.locoConnected) {
            throw new Error('Not connected to loco');
        }

        this.currentSocket!.disconnect();
    }

    async sendPacket(packet: LocoRequestPacket) {
        if (!this.locoConnected) {
            return false;
        }
        
        let packetId = this.packetWriter.getNextPacketId();

        this.packetMap.set(packetId, packet);

        if (!LocoPacketList.hasReqPacket(packet.PacketName)) {
            throw new Error(`Tried to send invalid packet ${packet.PacketName}`);
        }
        
        let header: PacketHeader = {
            packetId: packetId,
            statusCode: 0,
            packetName: packet.PacketName,
            bodyType: 0,
            bodySize: 0
        };

        let buffer = this.packetWriter.toBuffer(header, packet);
        header.bodyType = buffer.byteLength;

        let res = await this.CurrentSocket!.sendBuffer(buffer);

        this.packetSent(packetId, packet);

        return res;
    }

    async requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket) {
        this.sendPacket(packet);

        return packet.submitResponseTicket<T>();
    }

    packetSent(packetId: number, packet: LocoRequestPacket): void {
        if (this.Handler) this.Handler.onRequest(packetId, packet);
    }

    packetReceived(packetId: number, packet: LocoResponsePacket): void {
        if (this.packetMap.has(packetId)) {
            let requestPacket = this.packetMap.get(packetId)!;

            this.packetMap.delete(packetId);

            requestPacket.onResponse(packet);

            if (this.Handler) this.Handler.onResponse(packetId, packet, requestPacket);
        } else {
            if (this.Handler) this.Handler.onResponse(packetId, packet);
        }
    }

    responseReceived(header: PacketHeader, data: Buffer): void {
        try {
            let packet = this.packetReader.structToPacket(header, data);

            this.packetReceived(header.packetId, packet);

            if (header.packetName == 'KICKOUT') {
                this.disconnect();
            }
        } catch(e) {
            throw new Error(`Error while processing packet#${header.packetId} ${header.packetName}`);
        }
    }

    disconnected() {
        this.locoConnected = false;
        this.currentSocket = null;

        if (this.pingSchedulerId) clearTimeout(this.pingSchedulerId);

       if (this.Handler) this.Handler.onDisconnected();
    }
    
}

export class HostData {

    static readonly BookingHost: HostData = new HostData(KakaoAPI.LocoEntry, KakaoAPI.LocoEntryPort);
    
    constructor(
        public Host: string,
        public Port: number
    ) {

    }

}

export class BookingData {

    constructor(
        public CheckinHost: HostData
    ) {

    }

}

export class CheckinData {

    constructor(
        public LocoHost: HostData,
        public expireTime: number
    ) {

    }

}