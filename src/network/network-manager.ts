import { LocoPacketHandler, TalkClient, LocoRequestPacket, LocoResponsePacket, Long } from "..";
import { LocoManager, BookingData, CheckinData } from "../loco/loco-manager";
import { LoginAccessDataStruct } from "../talk/struct/login-access-data-struct";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "../packet/loco-bson-packet";
import { EventEmitter } from "events";
import { PacketMessageRes } from "../packet/packet-message";
import { PacketLoginRes } from "../packet/packet-login";
import { SessionManager } from "../talk/manage/session-manager";
import { ChatChannel } from "../talk/room/chat-channel";
import { PacketChatInfoReq, PacketChatInfoRes } from "../packet/packet-chatinfo";
import { PacketKickoutRes } from "../packet/packet-kickout";
import { PacketChatMemberRes } from "../packet/packet-chat-member";
import { PacketNewMemberRes } from "../packet/packet-new-member";
import { PacketLeftRes } from "../packet/packet-leave";
import { PacketChanJoinRes } from "../packet/packet-chan-join";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class NetworkManager {
    
    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private latestCheckinReq: number;

    private handler: LocoPacketHandler;

    private locoManager: LocoManager;

    constructor(private client: TalkClient) {
        this.handler = this.createPacketHandler();
        this.locoManager = new LocoManager(this.handler);

        this.cachedBookingData = null;
        this.cachedCheckinData = null;
        this.latestCheckinReq = -1;
    }

    protected createPacketHandler() {
        return new TalkPacketHandler(this);
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

    protected async getCachedCheckin(userId: number, forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.latestCheckinReq < Date.now() || forceRecache) {
            this.cachedCheckinData = await this.locoManager.getCheckinData((await this.getCachedBooking()).CheckinHost, userId);
            this.latestCheckinReq = Date.now();
        }

        return this.cachedCheckinData;
    }

    async locoLogin(deviceUUID: string, userId: number, accessToken: string) {
        if (this.Logon) {
            throw new Error('Already logon to loco');
        }
        
        let checkinData = await this.getCachedCheckin(userId);

        await this.locoManager.connectToLoco(checkinData.LocoHost, checkinData.expireTime);
        await this.locoManager.loginToLoco(deviceUUID, accessToken);
    }

    async logout() {
        if (!this.Logon) {
            throw new Error('Not logon to loco');
        }

        if (this.locoManager.LocoConnected) {
            this.locoManager.disconnect();
        }
    }

    async sendPacket(packet: LocoRequestPacket) {
        return this.locoManager.sendPacket(packet);
    }

    requestChannelInfo(channelId: Long) {
        this.sendPacket(new PacketChatInfoReq(channelId));
    }
    
}

export class TalkPacketHandler extends EventEmitter implements LocoPacketHandler {

    private networkManager: NetworkManager;

    private logonPassed: boolean;

    constructor(networkManager: NetworkManager) {
        super();

        this.networkManager = networkManager;
        this.logonPassed = false;

        this.on('LOGINLIST', this.onLoginPacket.bind(this));
        this.on('MSG', this.onMessagePacket.bind(this));
        this.on('CHATINFO', this.onChatInfo.bind(this));
        this.on('MEMBER', this.onDetailMember.bind(this));
        this.on('NEWMEM', this.onNewMember.bind(this));
        this.on('SYNCJOIN', this.onChannelJoin.bind(this));
        this.on('LEFT', this.onChannelLeft.bind(this));
        this.on('KICKOUT', this.onKicked.bind(this));
    }

    get NetworkManager() {
        return this.networkManager;
    }

    get Client() {
        return this.networkManager.Client;
    }

    get SessionManager(): SessionManager {
        return this.Client.SessionManager!;
    }

    onRequest(packet: LocoRequestPacket): void {
        console.log(`${packet.PacketName} <- ${JSON.stringify(packet)}`);
    }
    
    onResponse(packet: LocoResponsePacket): void {
        this.emit(packet.PacketName, packet);
    }

    onLoginPacket(packet: PacketLoginRes) {
        if (this.logonPassed) {
            throw new Error(`Received another login packet?!?`);
        }
        this.logonPassed = true;

        this.SessionManager.initSession(packet.ChatDataList);
    }

    onMessagePacket(packet: PacketMessageRes) {
        let chanId = packet.ChannelId;

        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);

        let now = Date.now();
        if (channel.LastInfoUpdate + ChatChannel.INFO_UPDATE_INTERVAL <= now) {
            this.NetworkManager.requestChannelInfo(channel.ChannelId);
            channel.LastInfoUpdate = now;
        }

        let chatLog = packet.Chatlog;
        let chat = this.SessionManager.chatFromChatlog(chatLog);

        channel.chatReceived(chat);
    }

    onChatInfo(packet: PacketChatInfoRes) {
        let chanId = packet.ChatInfo.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);

        channel.ChannelInfo.update(packet.ChatInfo);
    }

    onNewMember(packet: PacketNewMemberRes) {
        let chanId = packet.Chatlog.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);
        let channelInfo = channel.ChannelInfo;

        let chatlog = packet.Chatlog;

        channelInfo.addUserJoined(chatlog.SenderId, chatlog.Text);
    }

    onChannelLeft(packet: PacketLeftRes) {
        let chanId = packet.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }
        let channel = this.SessionManager.getChannelById(chanId);

        this.SessionManager.removeChannelLeft(chanId);
    }

    onChannelJoin(packet: PacketChanJoinRes) {
        let chanId = packet.Chatlog.ChannelId;
        if (this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }
        
        let newChan = this.SessionManager.addChannel(chanId);

        let now = Date.now();
        if (newChan.LastInfoUpdate + ChatChannel.INFO_UPDATE_INTERVAL <= now) {
            this.NetworkManager.requestChannelInfo(newChan.ChannelId);
            newChan.LastInfoUpdate = now;
        }
    }

    onDetailMember(packet: PacketChatMemberRes) {

    }

    onKicked(packet: PacketKickoutRes) {
        let reason = packet.Reason;

        // do something
    }
    
}