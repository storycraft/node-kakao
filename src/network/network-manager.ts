import { LocoPacketHandler, LocoRequestPacket, LocoResponsePacket, Long } from "..";
import { LocoManager, BookingData, CheckinData } from "../loco/loco-manager";
import { PacketLoginRes, PacketLoginReq } from "../packet/packet-login";
import { LocoClient } from "../client";
import { LocoInterface } from "../loco/loco-interface";
import { PacketPingReq } from "../packet/packet-ping";
import { TalkPacketHandler } from "./packet-handler";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class NetworkManager implements LocoInterface {
    
    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private lastCheckinReq: number;

    private packetMap: Map<number, LocoRequestPacket>;

    private handler: LocoPacketHandler;

    private pingSchedulerId: NodeJS.Timeout | null;

    private locoManager: LocoManager;

    private locoLogon: boolean;

    constructor(private client: LocoClient) {
        this.packetMap = new Map();
        
        this.pingSchedulerId = null;

        this.handler = this.createPacketHandler();
        this.locoManager = new LocoManager(this);

        this.locoLogon = false;

        this.cachedBookingData = null;
        this.cachedCheckinData = null;
        this.lastCheckinReq = -1;
    }

    protected createPacketHandler() {
        return new TalkPacketHandler(this);
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
        return this.locoManager.Connected;
    }

    get Logon() {
        return this.locoLogon;
    }

    protected async getCachedBooking(forceRecache: boolean = false): Promise<BookingData> {
        if (!this.cachedBookingData || forceRecache) {
            try {
                this.cachedBookingData = await this.locoManager.getBookingData();
            } catch (statusCode) {
                throw new Error(`Booking failed. code: ${statusCode}`);
            }
        }

        return this.cachedBookingData;
    }

    protected async getCachedCheckin(userId: Long, forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.lastCheckinReq < Date.now() || forceRecache) {
            try {
                this.cachedCheckinData = await this.locoManager.getCheckinData((await this.getCachedBooking()).CheckinHost, userId);
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
        
        let checkinData = await this.getCachedCheckin(userId);

        await this.locoManager.connectToLoco(checkinData.LocoHost);

        let res = await this.loginToLoco(deviceUUID, accessToken);
        
        this.locoLogon = true;

        return res;
    }

    async loginToLoco(deviceUUID: string, accessToken: string): Promise<PacketLoginRes> {
        if (!this.Connected) {
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
        if (!this.Connected) {
            return;
        }

        this.pingSchedulerId = setTimeout(this.schedulePing.bind(this), LocoManager.PING_INTERVAL);

        this.sendPacket(new PacketPingReq());
    }

    async disconnect() {
        if (!this.locoManager.Connected) {
            throw new Error('Not connected to loco');
        }

        this.locoManager.disconnect();
    }

    async sendPacket(packet: LocoRequestPacket) {
        let id = this.locoManager.Writer.getNextPacketId();

        this.packetMap.set(id, packet);
        return this.locoManager.sendPacket(id, packet);
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

    disconnected() {
        if (this.pingSchedulerId) clearTimeout(this.pingSchedulerId);

       if (this.Handler) this.Handler.onDisconnected();
    }
    
}