import { LocoPacketHandler, TalkClient, LocoRequestPacket, LocoResponsePacket } from "..";
import { LocoManager, BookingData, CheckinData } from "../loco/loco-manager";
import { LoginAccessDataStruct } from "../talk/struct/login-access-data-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class NetworkManager implements LocoPacketHandler {
    
    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private latestCheckinReq: number;

    private accessData: LoginAccessDataStruct;

    private locoManager: LocoManager;

    constructor(private client: TalkClient) {
        this.locoManager = new LocoManager(this);

        this.cachedBookingData = null;
        this.cachedCheckinData = null;
        this.latestCheckinReq = -1;

        this.accessData = new LoginAccessDataStruct();
    }

    get Client() {
        return this.client;
    }

    get NeedReLogon() {
        return this.locoManager.NeedRelogin;
    }

    get Connected() {
        return this.locoManager.LocoConnected;
    }

    get Logon() {
        return this.locoManager.LocoLogon;
    }

    protected async getCachedBooking(forceRecache: boolean = false): Promise<BookingData> {
        if (!this.cachedBookingData || forceRecache) {
            this.cachedBookingData = await this.locoManager.getBookingData();
        }

        return this.cachedBookingData;
    }

    protected async getCachedCheckin(forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.latestCheckinReq < Date.now() || forceRecache) {
            this.cachedCheckinData = await this.locoManager.getCheckinData((await this.getCachedBooking()).CheckinHost, this.accessData.UserId);
            this.latestCheckinReq = Date.now();
        }

        return this.cachedCheckinData;
    }

    async locoLogin(deviceUUID: string, accessData: LoginAccessDataStruct) {
        if (this.Logon) {
            throw new Error('Already logon to loco');
        }

        this.accessData = accessData;
        
        let checkinData = await this.getCachedCheckin();

        await this.locoManager.connectToLoco(checkinData.LocoHost, checkinData.expireTime);
        await this.locoManager.loginToLoco(deviceUUID, accessData.AccessToken);
    }

    async logout() {
        if (!this.Logon) {
            throw new Error('Not logon to loco');
        }

        if (this.locoManager.LocoConnected) {
            this.locoManager.disconnect();
        }
    }

    onRequest(packet: LocoRequestPacket): void {
        console.log(`${packet.PacketName} <- ${JSON.stringify(packet)}`);
    }
    
    onResponse(packet: LocoResponsePacket): void {
        console.log(`${packet.PacketName} -> ${JSON.stringify(packet)}`);
    }
    
}