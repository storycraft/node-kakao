import { LocoSocket } from "../network/loco-socket";
import { Socket } from "net";
import { KakaoAPI } from "../kakao-api";
import { LocoSecureSocket } from "../network/loco-secure-socket";
import { LocoTLSSocket } from "../network/loco-tls-socket";
import { LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { PacketGetConfReq, PacketGetConfRes } from "../packet/packet-get-conf";
import { PacketCheckInReq, PacketCheckInRes } from "../packet/packet-check-in";
import { PacketLoginReq, PacketLoginRes } from "../packet/packet-login";
import { LocoPacketHandler } from "./loco-packet-handler";
import { LocoPacketList } from "../packet/loco-packet-list";

/*
 * Created on Thu Oct 24 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoManager {

    private locoSocket: LocoSocket<Socket> | null;
    private expireTime: number;

    private handler: LocoPacketHandler | null;

    private locoConnected: boolean;
    private locoLogon: boolean;

    constructor(handler: LocoPacketHandler | null = null) {
        this.locoSocket = null;

        this.expireTime = 0;
        
        this.handler = handler;

        this.locoConnected = false;
        this.locoLogon = false;
    }

    get Handler() {
        return this.handler;
    }

    set Handler(handler) {
        this.handler = handler;
    }

    get LocoSocket() {
        return this.locoSocket;
    }

    get LocoConnected() {
        return this.locoConnected;
    }

    get LocoLogon() {
        return this.locoLogon;
    }
    
    get NeedRelogin() {
        return this.LocoConnected && this.expireTime < Date.now();
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

    async connect(deviceUUID: string, accessToken: string, userId: number): Promise<boolean> {
        let bookingData = await this.getBookingData();
        let checkinData = await this.getCheckinData(bookingData.CheckinHost, userId);
        
        await this.connectToLoco(checkinData.LocoHost, checkinData.expireTime);

        try {
            await this.loginToLoco(deviceUUID, accessToken);
            this.locoLogon = true;
        } catch (e) {
            throw new Error('Cannot login to LOCO ' + e);
        }

        return true;
    }

    async connectToLoco(locoHost: HostData, expireTime: number): Promise<boolean> {
        this.locoSocket = this.createLocoSocket(locoHost);

        this.locoConnected = await this.locoSocket.connect();

        this.expireTime = expireTime;

        if (!this.locoConnected) {
            throw new Error('Cannot connect to LOCO server');
        }

        this.locoSocket.on('packet', this.onPacket.bind(this));

        return true;
    }

    async loginToLoco(deviceUUID: string, accessToken: string): Promise<PacketLoginRes> {
        if (!this.locoConnected) {
            throw new Error('Not connected to LOCO');
        }

        if (this.locoLogon) {
            throw new Error('Already logon to LOCO');
        }

        return new Promise((resolve) => {
            this.locoSocket!.once('packet', (packet: LocoResponsePacket) => {
                if (packet.PacketName !== 'LOGINLIST') {
                    throw new Error('Received wrong packet');
                }

                this.locoLogon = true;
                resolve(packet as PacketLoginRes);
            });

            this.locoSocket!.sendPacket(new PacketLoginReq(deviceUUID, accessToken));
        });
    }

    async getCheckinData(checkinHost: HostData, userId: number): Promise<CheckinData> {
        let socket = this.createCheckinSocket(checkinHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to checkin server');
        }

        return await new Promise((resolve) => {
            socket.once('packet', (packet: LocoResponsePacket) => {
                if (packet.PacketName !== 'CHECKIN') {
                    throw new Error('Received wrong packet');
                }

                let checkIn = packet as PacketCheckInRes;

                resolve(new CheckinData(new HostData(checkIn.Host, checkIn.Port), checkIn.CacheExpire));
            });

            socket.sendPacket(new PacketCheckInReq(userId));
        });
    }

    async getBookingData(bookingHost: HostData = HostData.BookingHost): Promise<BookingData> {
        let socket = this.createBookingSocket(bookingHost);

        let connected = await socket.connect();

        if (!connected) {
            throw new Error('Cannot contact to booking server');
        }

        return await new Promise((resolve, reject) => {
            socket.once('packet', (packet: LocoResponsePacket) => {
                if (packet.PacketName !== 'GETCONF') {
                    throw new Error('Received wrong packet');
                }

                let getConfRes = packet as PacketGetConfRes;

                if (getConfRes.HostList.length < 1 && getConfRes.PortList.length < 1) {
                    reject(new Error(`No server avaliable`));
                }

                resolve(new BookingData(new HostData(getConfRes.HostList[0], getConfRes.PortList[0])));
            });

            socket.sendPacket(new PacketGetConfReq());
        });
    }

    protected onPacket(packet: LocoResponsePacket) {
        if (this.Handler) {
            this.Handler.onResponse(packet);
        }

        if (packet.PacketName == 'KICKOUT') {
            this.disconnect();
        }
    }

    protected onPacketSend(packet: LocoRequestPacket) {
        if (this.Handler) {
            this.Handler.onRequest(packet);
        }
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        if (!this.LocoConnected) {
            return false;
        }

        if (!LocoPacketList.hasReqPacket(packet.PacketName)) {
            throw new Error(`Invalid packet ${packet.PacketName}`);
        }

        this.onPacketSend(packet);

        return this.LocoSocket!.sendPacket(packet);
    }

    disconnect() {
        if (this.locoConnected) {
            this.LocoSocket!.disconnect();
        }

        this.locoConnected = false;
        this.locoLogon = false;
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