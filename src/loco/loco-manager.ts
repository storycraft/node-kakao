import { LocoSocket } from "../network/loco-socket";
import { Socket } from "net";
import { KakaoAPI } from "../kakao-api";
import { LocoSecureSocket } from "../network/loco-secure-socket";
import { LocoTLSSocket } from "../network/loco-tls-socket";
import { LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { LocoGetConfReq, LocoGetConfRes } from "../packet/loco-get-conf";
import { LocoCheckInReq, LocoCheckInRes } from "../packet/loco-check-in";
import { LocoLoginReq } from "../packet/loco-login";
import { EventEmitter } from "events";
import { on, listeners } from "cluster";

/*
 * Created on Thu Oct 24 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoManager extends EventEmitter {

    private locoSocket: LocoSocket<Socket> | null;
    private expireTime: number;

    private locoConnected: boolean;
    private locoLogon: boolean;

    constructor() {
        super();

        this.locoSocket = null;

        this.expireTime = 0;

        this.locoConnected = false;
        this.locoLogon = false;
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

    async loginToLoco(deviceUUID: string, accessToken: string) {
        if (!this.locoConnected) {
            throw new Error('Not connected to LOCO');
        }

        if (this.locoLogon) {
            throw new Error('Already logon to LOCO');
        }

        return new Promise((resolve) => {
            this.locoSocket!.once('packet', resolve);

            this.locoSocket!.sendPacket(new LocoLoginReq(deviceUUID, accessToken));
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

                let checkIn = packet as LocoCheckInRes;

                resolve(new CheckinData(new HostData(checkIn.Host, checkIn.Port), checkIn.CacheExpire));
            });

            socket.sendPacket(new LocoCheckInReq(userId));
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

                let getConfRes = packet as LocoGetConfRes;

                if (getConfRes.HostList.length < 1 && getConfRes.PortList.length < 1) {
                    reject(new Error(`No server avaliable`));
                }

                resolve(new BookingData(new HostData(getConfRes.HostList[0], getConfRes.PortList[0])));
            });

            socket.sendPacket(new LocoGetConfReq());
        });
    }

    protected onPacket(packet: LocoResponsePacket) {
        this.emit('packet', packet);
        this.emit(packet.PacketName, packet);
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        if (!this.LocoConnected) {
            return false;
        }

        return this.LocoSocket!.sendPacket(packet);
    }

    disconnect() {
        if (!this.locoConnected) {
            throw new Error('Not connected to LOCO');
        }

        this.LocoSocket!.disconnect();

        this.locoConnected = false;
        this.locoLogon = false;
    }

    on(event: 'packet', listener: (packet: LocoResponsePacket) => void): this;

    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'packet', listener: (packet: LocoResponsePacket) => void): this;

    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
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