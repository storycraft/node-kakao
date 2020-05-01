import { ChatUser, ClientChannelUser } from "../user/chat-user";
import { Long } from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatInfoStruct, ChannelMetaStruct, ChannelMetaType } from "../struct/chat-info-struct";
import { EventEmitter } from "events";
import { Chat } from "../chat/chat";
import { PacketMessageWriteReq, PacketMessageWriteRes } from "../../packet/packet-message";
import { MessageType } from "../chat/message-type";
import { MemberStruct } from "../struct/member-struct";
import { MessageTemplate } from "../chat/template/message-template";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { ChatContent } from "../chat/attachment/chat-attachment";
import { SessionManager } from "../session/session-manager";
import { ChatBuilder } from "../chat/chat-builder";
import { PacketMessageNotiReadReq } from "../../packet/loco-noti-read";
import { ChatFeed } from "../chat/chat-feed";
import { PacketLeaveReq, PacketLeaveRes } from "../../packet/packet-leave";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 1800000;

    private sessionManager: SessionManager;

    private channelId: Long;

    private lastChat: Chat | null;

    private channelInfo: ChannelInfo | null;

    constructor(sessionManager: SessionManager, channelId: Long) {
        super();
        this.sessionManager = sessionManager;

        this.channelId = channelId;

        this.channelInfo = null;
        this.lastChat = null;
    }

    get SessionManager() {
        return this.sessionManager;
    }

    get Client() {
        return this.sessionManager.Client;
    }

    get LastChat() {
        return this.lastChat;
    }

    get ChannelId() {
        return this.channelId;
    }

    async getChannelInfo(forceUpdate?: boolean) {
        if (!this.channelInfo) {
            this.channelInfo = new ChannelInfo(this);
        }

        if (forceUpdate || this.channelInfo.LastInfoUpdated + ChatChannel.INFO_UPDATE_INTERVAL <= Date.now()) {
            await this.channelInfo.updateInfo();
        }

        return this.channelInfo;
    }

    chatReceived(chat: Chat) {
        this.updateLastChat(chat);

        this.emit('message', chat);
        this.Client.emit('message', chat);
    }

    updateLastChat(chat: Chat) {
        if (chat.Channel !== this) {
            throw new Error('Pointed to wrong channel');
        }

        this.lastChat = chat;
    }

    async markChannelRead() {
        await this.Client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(this.channelId));
    }

    async sendText(...textFormat: (string | ChatContent)[]): Promise<Chat> {
        let { text, extra } = ChatBuilder.buildMessage(...textFormat);
        
        let userId = this.sessionManager.ClientUser.UserId;
        
        let res = await this.sessionManager.Client.NetworkManager.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.sessionManager.getNextMessageId(), this.channelId, text, MessageType.Text, false, extra));

        let chat = this.sessionManager.chatFromChatlog(new ChatlogStruct(res.LogId, res.PrevLogId, userId, this.channelId, MessageType.Text, text, Math.floor(Date.now() / 1000), extra, res.MessageId));
        
        return chat;
    }
    
    async sendTemplate(template: MessageTemplate): Promise<Chat> {
        if (!template.Valid) {
            throw new Error('Invalid template');
        }

        let sentType = template.getMessageType();
        let text = template.getPacketText();
        let extra = template.getPacketExtra();

        let channelInfo = await this.getChannelInfo();

        let res = await this.sessionManager.Client.NetworkManager.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.sessionManager.getNextMessageId(), this.channelId, text, sentType, false, extra));

        let chat = this.sessionManager.chatFromChatlog(new ChatlogStruct(res.LogId, res.PrevLogId, channelInfo.ChannelClientUser.UserId, this.channelId, sentType, template.getPacketText(), Math.floor(Date.now() / 1000), extra, res.MessageId));

        return chat;
    }

    async leave(block: boolean = false): Promise<Long> {
        let res = await this.sessionManager.Client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(this.ChannelId, block));
        this.sessionManager.removeChannelLeft(this.ChannelId);

        return res.LastTokenId;
    }

    on(event: 'message' | string, listener: (chat: Chat) => void): this;
    on(event: 'join' | string, listener: (newUser: ChatUser, joinMessage: string) => void): this;
    on(event: 'left' | string, listener: (leftUser: ChatUser) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'message' | string, listener: (chat: Chat) => void): this;
    once(event: 'join' | string, listener: (newUser: ChatUser, joinMessage: string) => void): this;
    once(event: 'left' | string, listener: (leftUser: ChatUser) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}

export class ChannelInfo {

    private channel: ChatChannel;

    private roomType: ChatroomType;

    private infoLoaded: boolean;
    private memberListLoaded: boolean;

    private lastInfoUpdated: number;

    private roomImageURL: string;
    private roomFullImageURL: string;

    private name: string;

    private isFavorite: boolean;

    private isDirectChan: boolean;

    private chatmetaList: ChannelMetaStruct[];

    private clientChannelUser: ClientChannelUser;

    private openLinkId?: Long;
    private openLinkInfo?: OpenLinkStruct;

    private activeUserList: MemberStruct[];

    private localUserMap: Map<string, ChatUser>;

    private pendingInfoReq: Promise<void> | null;
    private pendingUserInfoReq: Promise<void> | null;

    constructor(channel: ChatChannel) {
        this.channel = channel;
        this.infoLoaded = false;
        this.memberListLoaded = false;

        this.roomType = ChatroomType.UNKNOWN;

        this.lastInfoUpdated = -1;

        this.activeUserList = [];
        this.localUserMap = new Map();

        this.roomImageURL = '';
        this.roomFullImageURL = '';

        this.name = '';
        this.isFavorite = false;

        this.chatmetaList = [];
        this.isDirectChan = false;

        this.clientChannelUser = new ClientChannelUser(this.Channel.SessionManager.ClientUser);

        this.pendingInfoReq = this.pendingUserInfoReq = null;
    }

    get Channel() {
        return this.channel;
    }

    get ChannelClientUser() {
        return this.clientChannelUser;
    }

    get Name() {
        return this.name;
    }

    get RoomImageURL() {
        return this.roomImageURL;
    }

    get RoomFullImageURL() {
        return this.roomFullImageURL;
    }

    get IsFavorite() {
        return this.isFavorite;
    }

    get RoomType() {
        return this.roomType;
    }

    get InfoLoaded() {
        return this.infoLoaded;
    }

    get IsDirectChan() {
        return this.isDirectChan;
    }

    get LastInfoUpdated() {
        return this.lastInfoUpdated;
    }

    get UserList() {
        return Array.from(this.localUserMap.values());
    }

    get ChatMetaList() {
        return this.chatmetaList;
    }

    get OpenLinkId() {
        return this.openLinkId || null;
    }

    get OpenLinkToken() {
        if (this.openLinkInfo) return this.openLinkInfo.OpenToken;

        return null;
    }

    get ClientOpenLinkProfile() {
        if (this.openLinkInfo) return this.openLinkInfo.Member;

        return null;
    }

    get ChannelOpenLinkURL() {
        if (this.openLinkInfo) return this.openLinkInfo.LinkURL;

        return null;
    }

    get IsOpenChat() {
        return this.roomType === ChatroomType.OPENCHAT_DIRECT || this.roomType === ChatroomType.OPENCHAT_GROUP;
    }

    hasUser(id: Long) {
        return this.localUserMap.has(id.toString()) || this.clientChannelUser.UserId.equals(id);
    }

    getUser(id: Long): ChatUser | null {
        if (this.clientChannelUser.UserId.equals(id)) {
            return this.clientChannelUser;
        }

        if (!this.hasUser(id)) {
            return null;
        }

        return this.localUserMap.get(id.toString())!;
    }

    addUserJoined(userId: Long, joinFeed: ChatFeed): ChatUser {
        let newUser = this.addUserInternal(userId);

        this.channel.emit('join', newUser, joinFeed);
        this.channel.Client.emit('user_join', this.channel, newUser, joinFeed);

        return newUser;
    }

    protected addUserInternal(userId: Long) {
        if (this.hasUser(userId) || this.channel.SessionManager && this.channel.SessionManager.ClientUser.UserId.equals(userId)) {
            throw new Error('This user already joined');
        }

        let newUser = this.channel.SessionManager.getUser(userId);

        this.localUserMap.set(userId.toString(), newUser);

        return newUser;
    }

    removeUserLeft(id: Long): ChatUser | null {
        let user = this.removeUserLeftInternal(id);

        if (!user) return null;

        this.Channel.emit('left', user);
        this.channel.Client.emit('user_left', this.channel, user);

        return user;
    }

    protected removeUserLeftInternal(id: Long): ChatUser | null {
        if (this.channel.SessionManager && this.channel.SessionManager.ClientUser.UserId.equals(id)) {
            throw new Error('Client user cannot be removed');
        }

        let user = this.getUser(id);

        this.localUserMap.delete(id.toString());

        return user;
    }

    updateFromStruct(chatinfoStruct: ChatInfoStruct, openLinkInfo?: OpenLinkStruct) {
        this.activeUserList = chatinfoStruct.MemberList;

        let lastChatlog = chatinfoStruct.LastChatLog;

        if (lastChatlog) {
            try {
                let lastChat = this.channel.Client.SessionManager!.chatFromChatlog(lastChatlog);
                this.channel.updateLastChat(lastChat);
            } catch (e) {
                // JUST PASS IF IT IS NOT VALID
            }
        }

        this.isDirectChan = chatinfoStruct.IsDirectChat;
        this.chatmetaList = chatinfoStruct.ChatMetaList;

        for (let meta of this.chatmetaList) {
            if (meta.Type === ChannelMetaType.TITLE) {
                this.updateRoomName(meta.Content);
            }
        }

        this.roomImageURL = chatinfoStruct.Meta.ImageURL;
        this.roomFullImageURL = chatinfoStruct.Meta.FullImageURL;

        this.isFavorite = chatinfoStruct.Meta.Favorite;

        this.roomType = chatinfoStruct.Type;

        if (this.IsOpenChat)
            this.openLinkId = chatinfoStruct.OpenLinkId;
        
        if (!this.infoLoaded) {
            this.infoLoaded = true;
        }

        this.lastInfoUpdated = Date.now();
    }

    protected updateRoomName(name: string) {
        this.name = name;
    }

    protected initMemberList(memberList: MemberStruct[]): ChatUser[] {
        let list = this.updateMemberList(memberList);

        if (!this.memberListLoaded) {
            this.memberListLoaded = true;
        }

        for (let user of this.UserList) {
            if (!list.includes(user)) {
                this.removeUserLeftInternal(user.UserId);
            }
        }

        return list;
    }

    protected updateMemberList(memberList: MemberStruct[]): ChatUser[] {
        let list: ChatUser[] = [];

        for (let memberStruct of memberList) {
            let user: ChatUser;

            if (!this.hasUser(memberStruct.UserId)) {
                user = this.addUserInternal(memberStruct.UserId);
            } else {
                user = this.getUser(memberStruct.UserId)!;
            }

            user.UserInfo.updateFromChatInfo(memberStruct);
            list.push(user);
        }

        return list;
    }

    async updateInfo(): Promise<void> {
        if (this.pendingInfoReq) return this.pendingInfoReq;

        let networkManager = this.channel.Client.NetworkManager;

        let info = await networkManager.requestChannelInfo(this.channel.ChannelId);

        await this.updateMemberInfo(info);

        this.updateFromStruct(info, this.openLinkInfo);

        await this.updateOpenInfo();
    }

    async updateOpenInfo(): Promise<void> {
        if (this.IsOpenChat) {
            this.openLinkInfo = (await this.Channel.SessionManager.OpenChatManager.getOpenInfoFromId(this.OpenLinkId!))[0];
        }

        if (this.openLinkInfo) {
            this.updateRoomName(this.openLinkInfo.LinkName);
        }
    }

    protected async updateMemberInfo(chatInfo: ChatInfoStruct): Promise<void> {
        if (this.pendingUserInfoReq) return this.pendingUserInfoReq;

        let networkManager = this.channel.Client.NetworkManager;

        let infoList = await networkManager.requestMemberInfo(this.channel.ChannelId);
        let activeInfoList = await networkManager.requestSpecificMemberInfo(this.channel.ChannelId, chatInfo.MemberList.map((item) => item.UserId));
        
        this.initMemberList(infoList.slice().concat(activeInfoList));
    }

}