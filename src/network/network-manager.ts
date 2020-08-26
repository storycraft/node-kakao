/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacketHandler } from "../loco/loco-packet-handler";
import { TalkPacketHandler } from "./packet-handler";
import { LocoCommandInterface, LocoListener, LocoInterface, LocoTLSCommandInterface, LocoSecureCommandInterface, LocoReceiver } from "../loco/loco-interface";
import { LocoRequestPacket, LocoResponsePacket, StatusCode } from "../packet/loco-packet-base";
import { PacketLoginRes, PacketLoginReq } from "../packet/packet-login";
import { PacketPingReq } from "../packet/packet-ping";
import { LocoClient } from "../client";
import { PacketCheckInReq, PacketCheckInRes } from "../packet/checkin/packet-check-in";
import { PacketGetConfReq, PacketGetConfRes } from "../packet/booking/packet-get-conf";
import { PacketBuyCallServerRes, PacketBuyCallServerReq } from "../packet/checkin/packet-buy-call-server";
import { Long } from "bson";
import { HostData } from "./host-data";
import { MediaUploadInterface } from "../talk/media/media-upload-interface";
import { MediaDownloadInterface } from "../talk/media/media-download-interface";
import { ClientConfigProvider } from "../config/client-config-provider";

export class NetworkManager implements LocoListener, LocoInterface {

    public static readonly PING_INTERVAL = 600000;

    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private lastCheckinReq: number;
    
    private mainInterface: LocoMainInterface | null;

    private handler: LocoPacketHandler;

    constructor(private client: LocoClient, private configProvider: ClientConfigProvider) {
        this.cachedBookingData = null;
        this.cachedCheckinData = null;
        this.lastCheckinReq = -1;

        this.mainInterface = null;

        this.handler = this.createPacketHandler();
    }

    get Client() {
        return this.client;
    }

    get Connected(): boolean {
        return this.mainInterface && this.mainInterface.Connected || false;
    }

    get Logon() {
        return this.mainInterface && this.mainInterface.Logon || false;
    }

    get Handler() {
        return this.handler;
    }

    set Handler(handler) {
        this.handler = handler;
    }

    async connect(): Promise<boolean> {
        return this.mainInterface && this.mainInterface.connect() || false;
    }

    disconnect(): boolean {
        return this.mainInterface && this.mainInterface.disconnect() || false;
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        return this.mainInterface && await this.mainInterface.sendPacket(packet) || false;
    }

    async requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T> {
        if (!this.mainInterface) {
            throw new Error("Not Connected to loco");
        }

        return this.mainInterface.requestPacketRes<T>(packet);
    }

    protected createBookingInterface(hostInfo: HostData, listener = this, configProvider = this.configProvider): LocoCommandInterface {
        return new LocoTLSCommandInterface(hostInfo, listener, configProvider);
    }

    protected createCheckinInterface(hostInfo: HostData, listener = this, configProvider = this.configProvider): LocoCommandInterface {
        return new LocoSecureCommandInterface(hostInfo, listener, configProvider);
    }

    protected createMainInterface(hostInfo: HostData, listener = this, configProvider = this.configProvider): LocoMainInterface {
        return new MainInterface(hostInfo, listener, configProvider);
    }

    createUploadInterface(hostInfo: HostData, listener = this, configProvider = this.configProvider): MediaUploadInterface {
        return new MediaUploadInterface(hostInfo, listener, configProvider);
    }

    createDownloadInterface(hostInfo: HostData, listener = this, configProvider = this.configProvider): MediaDownloadInterface {
        return new MediaDownloadInterface(hostInfo, listener, configProvider);
    }

    async requestCheckinData(userId: Long): Promise<CheckinData> {
        let config = this.configProvider.Configuration;

        let res = await this.requestCheckinRes<PacketCheckInRes>(
            new PacketCheckInReq(userId, config.agent, config.netType, config.appVersion, config.mccmnc, config.language, config.countryIso, config.subDevice)
        );

        if (res.StatusCode !== StatusCode.SUCCESS) throw res.StatusCode;

        return new CheckinData({
            host: res.Host,
            port: res.Port,
            keepAlive: true
        }, res.CacheExpire);
    }

    async requestCallServerData(userId: Long): Promise<PacketBuyCallServerRes> {
        let config = this.configProvider.Configuration;

        let res = await this.requestCheckinRes<PacketBuyCallServerRes>(
            new PacketBuyCallServerReq(userId, config.agent, config.netType, config.appVersion, config.mccmnc, config.countryIso)
        );

        if (res.StatusCode !== StatusCode.SUCCESS) throw res.StatusCode;

        return res;
    }

    async requestBookingData(): Promise<BookingData> {
        let config = this.configProvider.Configuration;

        let res = await this.requestBookingRes<PacketGetConfRes>(new PacketGetConfReq(config.mccmnc, config.agent, config.deviceModel));

        return new BookingData({
            host: res.HostList[0],
            port: res.PortList[0],
            keepAlive: false
        });
    }

    async requestBookingRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T> {
        let config = this.configProvider.Configuration;

        let bookingInterface = this.createBookingInterface({
            host: config.locoBookingURL,
            port: config.locoBookingPort,
            keepAlive: false
        });

        if (!(await bookingInterface.connect())) {
            throw new Error('Cannot contact to booking server');
        }

        return bookingInterface.requestPacketRes<T>(packet);
    }

    async requestCheckinRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T> {
        let checkinInterface = this.createCheckinInterface((await this.getBookingData()).CheckinHost);

        if (!(await checkinInterface.connect())) {
            throw new Error('Cannot contact to checkin server');
        }

        return checkinInterface.requestPacketRes<T>(packet);
    }

    async getBookingData(forceRecache: boolean = false): Promise<BookingData> {
        if (!this.cachedBookingData || forceRecache) {
            try {
                this.cachedBookingData = await this.requestBookingData();
            } catch (statusCode) {
                throw new Error(`Booking failed. code: ${statusCode}`);
            }
        }

        return this.cachedBookingData;
    }

    async getCheckinData(userId: Long, forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.lastCheckinReq < Date.now() || forceRecache) {
            try {
                this.cachedCheckinData = await this.requestCheckinData(userId);
                this.lastCheckinReq = Date.now();
            } catch (statusCode) {
                throw new Error(`Checkin failed. code: ${statusCode}`);
            }
        }

        return this.cachedCheckinData;
    }

    protected createPacketHandler() {
        return new TalkPacketHandler(this);
    }

    async locoLogin(deviceUUID: string, userId: Long, accessToken: string): Promise<PacketLoginRes> {
        if (this.Logon) {
            throw new Error('Already logon to loco');
        }
        
        let checkinData = await this.getCheckinData(userId);

        this.mainInterface = this.createMainInterface(checkinData.LocoHost);

        if (!(await this.mainInterface.connect())) {
            throw new Error(`Loco Login failed`);
        }

        let res = await this.mainInterface.login(deviceUUID, accessToken);
        
        return res;
    }

    packetSent(packetId: number, packet: LocoRequestPacket): void {
        this.Handler.onRequest(packetId, packet);
    }
    
    packetReceived(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void {
        this.Handler.onResponse(packetId, packet, reqPacket);
    }

    onError(err: Error) {
        this.Client.emit('error', err);
    }

    disconnected(): void {
        this.Handler.onDisconnected();
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

export interface LocoMainInterface extends LocoInterface, LocoReceiver {

    readonly Logon: boolean;

    login(deviceUUID: string, accessToken: string): Promise<PacketLoginRes>;

}

export class MainInterface extends LocoSecureCommandInterface implements LocoMainInterface {

    private locoLogon: boolean = false;

    private pingSchedulerId: NodeJS.Timeout | null = null;

    constructor(hostData: HostData, listener: LocoListener, configProvider: ClientConfigProvider) {
        super(hostData, listener, configProvider);
    }

    get Logon() {
        return this.locoLogon;
    }

    async login(deviceUUID: string, accessToken: string): Promise<PacketLoginRes> {
        if (!this.Connected) {
            throw new Error('Not connected to LOCO');
        }

        if (this.locoLogon) {
            throw new Error('Already logon to LOCO');
        }

        let config = this.ConfigProvider.Configuration;
        let packet = new PacketLoginReq(
            deviceUUID,
            accessToken,
            config.appVersion,
            config.agent,
            config.deviceType,
            config.netType,
            config.mccmnc,
            config.language
        );

        let res = await this.requestPacketRes<PacketLoginRes>(packet);

        this.locoLogon = true;
        this.schedulePing();

        return res;
    }

    private schedulePing() {
        if (!this.Connected) {
            return;
        }

        this.pingSchedulerId = setTimeout(this.schedulePing.bind(this), NetworkManager.PING_INTERVAL);

        this.sendPacket(new PacketPingReq());
    }

    disconnected() {
        super.disconnected();

        if (this.pingSchedulerId) clearTimeout(this.pingSchedulerId);
        this.locoLogon = false;
    }

}