import { LocoSocket } from "../network/loco-socket";
import { Socket } from "net";
import { KakaoAPI } from "../kakao-api";
import { LocoSecureSocket } from "../network/loco-secure-socket";
import { LocoTLSSocket } from "../network/loco-tls-socket";
import { LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { PacketGetConfReq, PacketGetConfRes } from "../packet/packet-get-conf";
import { PacketCheckInReq, PacketCheckInRes } from "../packet/packet-check-in";
import { PacketLoginReq, PacketLoginRes } from "../packet/packet-login";
import { LocoPacketList } from "../packet/loco-packet-list";
import { PacketPingReq } from "../packet/packet-ping";
import { Long } from "bson";
import { LocoReceiver } from "./loco-interface";

/*
 * Created on Thu Oct 24 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoManager {

    public static readonly PING_INTERVAL = 600000;

    private pingSchedulerId: NodeJS.Timeout | null;

    private locoSocket: LocoSocket<Socket> | null;

    private locoConnected: boolean;
    private locoLogon: boolean;

    constructor(private receiver: LocoReceiver) {
        this.locoSocket = null;

        this.pingSchedulerId = null;

        this.locoConnected = false;
        this.locoLogon = false;
    }

    get Receiver() {
        return this.receiver;
    }

    get LocoSocket() {
        return this.locoSocket;
    }

    get Connected() {
        return this.locoConnected;
    }

    get Logon() {
        return this.locoLogon;
    }

    protected createBookingSocket(hostInfo: HostData) {
        return new LocoTLSSocket(hostInfo.Host, hostInfo.Port, false);
    }

    protected createCheckinSocket(hostInfo: HostData) {
        return new LocoSecureSocket(hostInfo.Host, hostInfo.Port, false);
    }

    protected createLocoSocket(hostInfo: HostData) {
        return new LocoSecureSocket(hostInfo.Host, hostInfo.Port, true);
    }

    async connect(deviceUUID: string, accessToken: string, userId: Long): Promise<boolean> {
        let bookingData = await this.getBookingData();
        let checkinData = await this.getCheckinData(bookingData.CheckinHost, userId);
        
        await this.connectToLoco(checkinData.LocoHost);

        try {
            await this.loginToLoco(deviceUUID, accessToken);
        } catch (e) {
            throw new Error('Cannot login to LOCO ' + e);
        }

        return true;
    }

    async connectToLoco(locoHost: HostData): Promise<boolean> {
        this.locoSocket = this.createLocoSocket(locoHost);

        this.locoConnected = await this.locoSocket.connect();

        if (!this.locoConnected) {
            throw new Error('Cannot connect to LOCO server');
        }

        this.locoSocket.on('packet', this.onPacket.bind(this));
        this.locoSocket.on('disconnected', this.onDisconnect.bind(this));

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
        let ticket = packet.submitResponseTicket<PacketLoginRes>();

        this.locoSocket!.sendPacket(packet);

        let res = await ticket;

        this.schedulePing();
        this.locoLogon = true;

        return res;
    }

    private schedulePing() {
        if (!this.locoLogon) {
            return;
        }

        this.pingSchedulerId = setTimeout(this.schedulePing.bind(this), LocoManager.PING_INTERVAL);

        this.sendPacket(new PacketPingReq());
    }

    async getCheckinData(checkinHost: HostData, userId: Long): Promise<CheckinData> {
        let socket = this.createCheckinSocket(checkinHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to checkin server');
        }

        let packet = new PacketCheckInReq(userId);
        let ticket = packet.submitResponseTicket<PacketCheckInRes>();
        socket.sendPacket(packet);

        let res = await ticket;

        socket.disconnect();

        return new CheckinData(new HostData(res.Host, res.Port), res.CacheExpire);
    }

    async getBookingData(bookingHost: HostData = HostData.BookingHost): Promise<BookingData> {
        let socket = this.createBookingSocket(bookingHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to booking server');
        }

        let packet = new PacketGetConfReq();
        let ticket = packet.submitResponseTicket<PacketGetConfRes>();
        socket.sendPacket(packet);

        let res = await ticket;

        socket.disconnect();
        
        if (res.HostList.length < 1 && res.PortList.length < 1) {
            throw new Error(`No server avaliable`);
        }

        return new BookingData(new HostData(res.HostList[0], res.PortList[0]));
    }

    protected onPacket(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket) {
        try {
            this.receiver.responseReceived(packetId, packet, reqPacket);

            if (packet.PacketName == 'KICKOUT') {
                this.disconnect();
            }
        } catch(e) {
            throw new Error(`Error while processing packet#${packetId} ${packet.PacketName}`);
        }
    }

    protected onPacketSend(packetId: number, packet: LocoRequestPacket) {
        this.receiver.requestSent(packetId, packet);
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        if (!this.Connected) {
            return false;
        }

        if (!LocoPacketList.hasReqPacket(packet.PacketName)) {
            console.log(`Tried to send invalid packet ${packet.PacketName}`);
            return false;
        }

        let promise = await this.LocoSocket!.sendPacket(packet);

        this.onPacketSend(this.LocoSocket!.Writer.CurrentPacketId, packet);

        return promise;
    }

    disconnect() {
        if (this.locoConnected) {
            this.locoSocket!.disconnect();
        }
    }

    onDisconnect() {
        this.locoConnected = false;
        this.locoLogon = false;

        this.locoSocket!.removeAllListeners();
        this.locoSocket = null;

        if (this.pingSchedulerId) clearTimeout(this.pingSchedulerId);

        this.receiver.disconnected();
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