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
import { LocoReceiver, LocoInterface } from "./loco-interface";
import { LocoPacketReader } from "../packet/loco-packet-reader";
import { LocoPacketWriter } from "../packet/loco-packet-writer";
import { PacketHeader } from "../packet/packet-header-struct";

/*
 * Created on Thu Oct 24 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoManager implements LocoReceiver {

    public static readonly PING_INTERVAL = 600000;

    private pingSchedulerId: NodeJS.Timeout | null;

    private currentSocket: LocoSocket<Socket> | null;

    private locoConnected: boolean;

    private packetWriter: LocoPacketWriter;
    private packetReader: LocoPacketReader;

    constructor(private locoInterface: LocoInterface, packetWriter: LocoPacketWriter = new LocoPacketWriter(), packetReader: LocoPacketReader = new LocoPacketReader()) {
        this.currentSocket = null;

        this.pingSchedulerId = null;

        this.locoConnected = false;

        this.packetWriter = packetWriter;
        this.packetReader = packetReader;
    }

    get LocoInterface() {
        return this.locoInterface;
    }

    get CurrentSocket() {
        return this.currentSocket;
    }

    get Connected() {
        return this.locoConnected;
    }

    get Writer() {
        return this.packetWriter;
    }

    get Reader() {
        return this.packetReader;
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

    async connectToLoco(locoHost: HostData): Promise<boolean> {
        this.currentSocket = this.createLocoSocket(locoHost);

        this.currentSocket.on('packet', this.onPacket.bind(this));
        this.currentSocket.on('disconnected', this.onDisconnect.bind(this));

        this.locoConnected = await this.currentSocket.connect();

        if (!this.locoConnected) {
            throw new Error('Cannot connect to LOCO server');
        }

        this.schedulePing();

        return true;
    }

    private schedulePing() {
        if (!this.locoConnected) {
            return;
        }

        this.pingSchedulerId = setTimeout(this.schedulePing.bind(this), LocoManager.PING_INTERVAL);

        this.sendPacket(this.packetWriter.getNextPacketId(), new PacketPingReq());
    }

    async getCheckinData(checkinHost: HostData, userId: Long): Promise<CheckinData> {
        let socket = this.createCheckinSocket(checkinHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to checkin server');
        }

        let packet = new PacketCheckInReq(userId);

        let res = await new Promise<PacketCheckInRes>((resolve, reject) => {
            socket.once('packet', (header, data) => {
                if (header.statusCode !== 0) reject(header.statusCode);
        
                resolve(this.packetReader.structToPacket<PacketCheckInRes>(header, data));
            });

            socket.sendBuffer(this.packetWriter.toBuffer({ packetId: 0, statusCode: 0, packetName: packet.PacketName, bodyType: 0, bodySize: 0 }, packet));
        });
        return new CheckinData(new HostData(res.Host, res.Port), res.CacheExpire);
    }

    async getBookingData(bookingHost: HostData = HostData.BookingHost): Promise<BookingData> {
        let socket = this.createBookingSocket(bookingHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to booking server');
        }

        let packet = new PacketGetConfReq();

        let res = await new Promise<PacketGetConfRes>((resolve, reject) => {
                socket.once('packet', (header, data) => {
                    if (header.statusCode !== 0) reject(header.statusCode);
            
                    resolve(this.packetReader.structToPacket<PacketGetConfRes>(header, data));
                });

                socket.sendBuffer(this.packetWriter.toBuffer({ packetId: 0, statusCode: 0, packetName: packet.PacketName, bodyType: 0, bodySize: 0 }, packet));
            });
        
        if (res.HostList.length < 1 && res.PortList.length < 1) {
            throw new Error(`No server avaliable`);
        }

        return new BookingData(new HostData(res.HostList[0], res.PortList[0]));
    }

    protected onPacket(header: PacketHeader, data: Buffer) {
        try {
            let packet = this.packetReader.structToPacket(header, data);

            this.locoInterface.packetReceived(header.packetId, packet);

            if (header.packetName == 'KICKOUT') {
                this.disconnect();
            }
        } catch(e) {
            throw new Error(`Error while processing packet#${header.packetId} ${header.packetName}`);
        }
    }

    protected onPacketSend(packetId: number, packet: LocoRequestPacket) {
        
    }

    async sendPacket(packetId: number, packet: LocoRequestPacket): Promise<boolean> {
        if (!this.Connected) {
            return false;
        }

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

        this.onPacketSend(packetId, packet);
        this.locoInterface.packetSent(packetId, packet);

        return res;
    }

    disconnect() {
        if (this.locoConnected) {
            this.currentSocket!.disconnect();
        }
    }

    onDisconnect() {
        this.locoConnected = false;

        this.currentSocket!.removeAllListeners();
        this.currentSocket = null;

        if (this.pingSchedulerId) clearTimeout(this.pingSchedulerId);
    }
    
    responseReceived(header: PacketHeader, data: Buffer): void {
        let packet = this.packetReader.structToPacket(header, data);
        
        this.locoInterface.packetReceived(header.packetId, packet);
    }

    disconnected() {
        this.locoInterface.disconnected();
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