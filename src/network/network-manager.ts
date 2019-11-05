import { LocoPacketHandler, TalkClient, LocoRequestPacket, LocoResponsePacket, Long, ChannelMetaSetStruct } from "..";
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
import { PacketChatMemberRes, PacketChatMemberReq } from "../packet/packet-chat-member";
import { PacketNewMemberRes } from "../packet/packet-new-member";
import { PacketLeftRes } from "../packet/packet-leave";
import { PacketChanJoinRes } from "../packet/packet-chan-join";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { PacketMessageReadRes } from "../packet/packet-message-read";
import { MemberStruct } from "../talk/struct/member-struct";
import { ChatUser } from "../talk/user/chat-user";
import { ChatroomType } from "../talk/chat/chatroom-type";
import { PacketGetMemberReq, PacketGetMemberRes } from "../packet/packet-get-member";
import { PacketGetMetaReq, PacketGetMetaRes, PacketGetMetasReq, PacketGetMetasRes } from "../packet/packet-get-meta";
import { ChannelMetaStruct } from "../talk/struct/chat-info-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class NetworkManager {
    
    private cachedBookingData: BookingData | null;
    private cachedCheckinData: CheckinData | null;
    private latestCheckinReq: number;

    private handler: TalkPacketHandler;

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

    async requestChannelInfo(channelId: Long): Promise<ChatInfoStruct> {
        return new Promise<ChatInfoStruct>((resolve, reject) => {
            this.sendPacket(new PacketChatInfoReq(channelId).once('response', (packet: PacketChatInfoRes) => {
                if (packet.ChatInfo.ChannelId.equals(channelId)) {
                    resolve(packet.ChatInfo);
                } else {
                    reject(new Error('Received wrong info packet'));
                }
            }));
        });
    }

    async requestMemberInfo(channelId: Long): Promise<MemberStruct[]> {
        return new Promise<MemberStruct[]>((resolve, reject) => {
            this.sendPacket(new PacketGetMemberReq(channelId).once('response', (packet: PacketGetMemberRes) => {
                resolve(packet.MemberList);
            }));
        });
    }
    
    async updateChannelInfo(channel: ChatChannel) {
        channel.LastInfoUpdate = Date.now();

        await this.updateMemberInfo(channel);

        let info = await this.requestChannelInfo(channel.ChannelId);
        channel.ChannelInfo.update(info);
    }

    async updateMemberInfo(channel: ChatChannel) {
        let infoList = await this.requestMemberInfo(channel.ChannelId);
        
        channel.ChannelInfo.updateMemberList(infoList);
    }
    
}

export class TalkPacketHandler extends EventEmitter implements LocoPacketHandler {

    private networkManager: NetworkManager;

    private logonPassed: boolean;

    constructor(networkManager: NetworkManager) {
        super();

        this.networkManager = networkManager;
        this.logonPassed = false;

        this.setMaxListeners(1000);

        this.on('LOGINLIST', this.onLoginPacket.bind(this));
        this.on('MSG', this.onMessagePacket.bind(this));
        this.on('MEMBER', this.onDetailMember.bind(this));
        this.on('NEWMEM', this.onNewMember.bind(this));
        this.on('DECUNREAD', this.onMessageRead.bind(this));
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

    onRequest(packetId: number, packet: LocoRequestPacket): void {
        //console.log(`${packet.PacketName} <- ${JSON.stringify(packet)}`);
    }
    
    onResponse(packetId: number, packet: LocoResponsePacket): void {
        //console.log(`${packet.PacketName} -> ${JSON.stringify(packet)}`);
        this.emit(packet.PacketName, packet);
    }

    async onLoginPacket(packet: PacketLoginRes) {
        if (this.logonPassed) {
            throw new Error(`Received another login packet?!?`);
        }
        this.logonPassed = true;

        await this.SessionManager.initSession(packet.ChatDataList);
    }

    async onMessagePacket(packet: PacketMessageRes) {
        let chanId = packet.ChannelId;

        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);

        if (channel.LastInfoUpdate + ChatChannel.INFO_UPDATE_INTERVAL <= Date.now()) {
            await this.NetworkManager.updateChannelInfo(channel);
        }

        let chatLog = packet.Chatlog;
        let chat = this.SessionManager.chatFromChatlog(chatLog);

        if (chat.Sender.UserInfo.Nickname !== packet.SenderNickname) {
            chat.Sender.UserInfo.updateNickname(packet.SenderNickname);
        }

        channel.chatReceived(chat);
    }

    async onMessageRead(packet: PacketMessageReadRes) {
        let chanId = packet.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);

        if (channel.LastInfoUpdate + ChatChannel.INFO_UPDATE_INTERVAL <= Date.now()) {
            await this.NetworkManager.updateChannelInfo(channel);
        }

        let reader = channel.ChannelInfo.getUser(packet.ReaderId);

        let watermark = packet.Watermark;

        this.Client.emit('message_read', channel, reader, watermark);
    } 

    async onNewMember(packet: PacketNewMemberRes) {
        let chanId = packet.Chatlog.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.getChannelById(chanId);

        let channelInfo = channel.ChannelInfo;

        let chatlog = packet.Chatlog;

        channelInfo.addUserJoined(chatlog.SenderId, chatlog.Text);

        if (channel.LastInfoUpdate + ChatChannel.INFO_UPDATE_INTERVAL <= Date.now()) {
            await this.NetworkManager.updateChannelInfo(channel);
        }
    }

    onChannelLeft(packet: PacketLeftRes) {
        let chanId = packet.ChannelId;
        if (!this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }

        let channel = this.SessionManager.removeChannelLeft(chanId);
    }

    async onChannelJoin(packet: PacketChanJoinRes) {
        let chanId = packet.Chatlog.ChannelId;
        if (this.SessionManager.hasChannel(chanId)) {
            //INVALID CHANNEL
            return;
        }
        
        let newChan = this.SessionManager.addChannel(chanId);
        await this.NetworkManager.updateChannelInfo(newChan);
    }

    onDetailMember(packet: PacketChatMemberRes) {

    }

    onKicked(packet: PacketKickoutRes) {
        let reason = packet.Reason;

        // do something
    }
    
}