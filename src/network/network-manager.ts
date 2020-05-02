import { LocoPacketHandler, TalkClient, LocoRequestPacket, LocoResponsePacket, Long, ChannelMetaSetStruct } from "..";
import { LocoManager, BookingData, CheckinData } from "../loco/loco-manager";
import { LoginAccessDataStruct } from "../talk/struct/login-access-data-struct";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "../packet/loco-bson-packet";
import { EventEmitter } from "events";
import { PacketMessageRes } from "../packet/packet-message";
import { PacketLoginRes } from "../packet/packet-login";
import { ChatChannel } from "../talk/channel/chat-channel";
import { PacketChatInfoReq, PacketChatInfoRes } from "../packet/packet-chatinfo";
import { PacketKickoutRes } from "../packet/packet-kickout";
import { PacketChatMemberRes, PacketChatMemberReq } from "../packet/packet-chat-member";
import { PacketNewMemberRes } from "../packet/packet-new-member";
import { PacketLeftRes, PacketLeaveRes } from "../packet/packet-leave";
import { PacketChanJoinRes } from "../packet/packet-chan-join";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { PacketMessageReadRes } from "../packet/packet-message-read";
import { MemberStruct } from "../talk/struct/member-struct";
import { ChatUser } from "../talk/user/chat-user";
import { ChannelType } from "../talk/chat/channel-type";
import { PacketGetMemberReq, PacketGetMemberRes } from "../packet/packet-get-member";
import { PacketGetMetaReq, PacketGetMetaRes, PacketGetMetasReq, PacketGetMetasRes } from "../packet/packet-get-meta";
import { ChannelMetaStruct } from "../talk/struct/chat-info-struct";
import { PacketMemberReq, PacketMemberRes } from "../packet/packet-member";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";
import { PacketInfoLinkReq, PacketInfoLinkRes } from "../packet/packet-info-link";
import { PacketSyncJoinOpenchatRes } from "../packet/packet-sync-join-openchat";
import { PacketDeleteMemberRes } from "../packet/packet-delmem";
import { FeedType } from "../talk/feed/feed-type";
import { ChatFeed } from "../talk/chat/chat-feed";
import { PacketKickMemberRes } from "../packet/packet-kick-member";

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

    get LocoManager() {
        return this.locoManager;
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

    protected async getCachedCheckin(userId: Long, forceRecache: boolean = false): Promise<CheckinData> {
        if (!this.cachedCheckinData || this.cachedCheckinData.expireTime + this.latestCheckinReq < Date.now() || forceRecache) {
            this.cachedCheckinData = await this.locoManager.getCheckinData((await this.getCachedBooking()).CheckinHost, userId);
            this.latestCheckinReq = Date.now();
        }

        return this.cachedCheckinData;
    }

    async locoLogin(deviceUUID: string, userId: Long, accessToken: string): Promise<PacketLoginRes> {
        if (this.Logon) {
            throw new Error('Already logon to loco');
        }
        
        let checkinData = await this.getCachedCheckin(userId);

        await this.locoManager.connectToLoco(checkinData.LocoHost, checkinData.expireTime);
        return await this.locoManager.loginToLoco(deviceUUID, accessToken);
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

    async requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket) {
        this.sendPacket(packet);

        return packet.submitResponseTicket<T>();
    }

    async requestChannelInfo(channelId: Long): Promise<ChatInfoStruct> {
        let res = await this.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(channelId));

        if (res.ChatInfo.ChannelId.equals(channelId)) {
            return res.ChatInfo;
        } else {
            throw new Error('Received wrong info packet');
        }
    }

    async requestMemberInfo(channelId: Long): Promise<MemberStruct[]> {
        let res = await this.requestPacketRes<PacketGetMemberRes>(new PacketGetMemberReq(channelId));
        return res.MemberList;
    }

    async requestSpecificMemberInfo(channelId: Long, idList: Long[]): Promise<MemberStruct[]> {
        let res = await this.requestPacketRes<PacketGetMemberRes>(new PacketMemberReq(channelId, idList));
        
        return res.MemberList;
    }
    
}

export class TalkPacketHandler extends EventEmitter implements LocoPacketHandler {

    private networkManager: NetworkManager;

    constructor(networkManager: NetworkManager) {
        super();

        this.networkManager = networkManager;

        this.setMaxListeners(1000);

        this.on('MSG', this.onMessagePacket.bind(this));
        this.on('NEWMEM', this.onNewMember.bind(this));
        this.on('DECUNREAD', this.onMessageRead.bind(this));
        this.on('SYNCLINKCR', this.onOpenChannelJoin.bind(this));
        this.on('KICKMEM', this.onOpenChannelKick.bind(this));
        this.on('DELMEM', this.onMemberDelete.bind(this));
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

    get ChatManager() {
        return this.Client.ChatManager;
    }

    get ChannelManager() {
        return this.Client.ChannelManager;
    }
    
    get UserManager() {
        return this.Client.UserManager;
    }

    onRequest(packetId: number, packet: LocoRequestPacket): void {
        //console.log(`${packet.PacketName} <- ${JSON.stringify(packet)}`);
    }
    
    onResponse(packetId: number, packet: LocoResponsePacket): void {
        //console.log(`${packet.PacketName} -> ${JSON.stringify(packet)}`);
        this.emit(packet.PacketName, packet);
    }

    async onMessagePacket(packet: PacketMessageRes) {
        let channel: ChatChannel = await this.ChannelManager.get(packet.ChannelId);

        let chatLog = packet.Chatlog;
        let chat = await this.ChatManager.chatFromChatlog(chatLog);

        let userInfo = (await chat.Channel.getChannelInfo()).getUserInfo(chat.Sender);

        if (userInfo) chat.Sender.updateNickname(packet.SenderNickname);

        channel.chatReceived(chat);
    }

    async onMessageRead(packet: PacketMessageReadRes) {
        let channel = await this.ChannelManager.get(packet.ChannelId);

        let channelInfo = await channel.getChannelInfo();

        let reader = await this.UserManager.get(packet.ReaderId);

        let watermark = packet.Watermark;

        reader.emit('message_read', channel, watermark);
        this.Client.emit('message_read', channel, reader, watermark);
    }

    async onNewMember(packet: PacketNewMemberRes) {
        let channel = await this.ChannelManager.get(packet.Chatlog.ChannelId);

        let channelInfo = await channel.getChannelInfo();

        let chatlog = packet.Chatlog;

        let feed = ChatFeed.getFeedFromText(chatlog.Text);

        let idList: Long[] = [];

        if (feed.FeedType === FeedType.INVITE && feed.MemberList) {
            for (let member of feed.MemberList) {
                idList.push(member.UserId);
            }
        } else if (feed.FeedType === FeedType.OPENLINK_JOIN && feed.Member) {
            idList.push(feed.Member.UserId);
        }

        for(let id of idList) {
            let user = await this.UserManager.get(id);

            if (user.isClientUser()) {
                user.emit('join', channel, feed);
                this.Client.emit('join_channel', channel);
            } else {
                await channelInfo.addUserJoined(id);

                user.emit('join', channel, feed);
                channel.emit('join', user, feed);
                this.Client.emit('user_join', channel, user, feed);
            }
        }
    }

    async onChannelLeft(packet: PacketLeftRes) {
        let channel = await this.ChannelManager.get(packet.ChannelId);

        this.ChannelManager.syncLeft(channel);
    }

    async onChannelJoin(packet: PacketChanJoinRes) {
        let chanId = packet.ChannelId;

        let newChan = await this.ChannelManager.get(chanId);

        this.Client.emit('join_channel', newChan);
    }

    async onOpenChannelJoin(packet: PacketSyncJoinOpenchatRes) {
        if (!packet.ChatInfo) return; // DO NOTHING IF ITS NOT CREATING CHAT CHANNEL

        let chanId = packet.ChatInfo.ChannelId;

        if (this.ChannelManager.has(chanId)) return;
        
        let newChan = await this.ChannelManager.get(chanId);

        this.Client.emit('join_channel', newChan);
    }

    async onOpenChannelKick(packet: PacketKickMemberRes) {
        let chanId = packet.ChannelId;

        if (this.ChannelManager.has(chanId)) return;
        
        let channel = await this.ChannelManager.get(chanId);

        let chat = await this.ChatManager.chatFromChatlog(packet.Chatlog);

        if (!chat.isFeed()) return;

        let feed = chat.getFeed();

        if (!feed.Member) return;

        let info = await chat.Channel.getChannelInfo();

        let kickedUser = await this.UserManager.get(feed.Member.UserId);

        kickedUser.emit('left', channel, feed);
        channel.emit('left', kickedUser, feed);
        this.Client.emit('user_left', kickedUser, feed);

        if (!this.Client.ClientUser.Id.equals(feed.Member.UserId)) info.removeUserLeft(feed.Member.UserId);
    }

    async onMemberDelete(packet: PacketDeleteMemberRes) {
        let chatLog = packet.Chatlog;

        let channel = await this.ChannelManager.get(chatLog.ChannelId);
        let chat = await this.ChatManager.chatFromChatlog(chatLog);

        if (!chat.isFeed()) return;

        let feed = chat.getFeed();

        if (!feed.Member) return;
        
        let info = await chat.Channel.getChannelInfo();
            
        let leftUser = await this.UserManager.get(feed.Member.UserId);

        leftUser.emit('left', channel, feed);
        channel.emit('left', leftUser, feed);
        this.Client.emit('user_left', leftUser, feed);

        info.removeUserLeft(feed.Member.UserId);
    }

    onKicked(packet: PacketKickoutRes) {
        let reason = packet.Reason;

        this.Client.emit('disconnected', reason);
    }
}