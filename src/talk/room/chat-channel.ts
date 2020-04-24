import { ChatUser, ClientChannelUser } from "../user/chat-user";
import { Long } from "bson";
import * as BSON from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatInfoStruct, ChannelMetaStruct, ChannelMetaType } from "../struct/chat-info-struct";
import { EventEmitter } from "events";
import { Chat } from "../chat/chat";
import { PacketMessageWriteReq, PacketMessageWriteRes } from "../../packet/packet-message";
import { MessageType } from "../chat/message-type";
import { MemberStruct } from "../struct/member-struct";
import { OpenLinkInfo } from "../open/open-link-info";
import { MessageTemplate } from "../chat/template/message-template";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { ChatMention, MentionContentList, ChatContent } from "../chat/chat-attachment";
import { TalkClient } from "../../talk-client";
import { JsonUtil } from "../../util/json-util";
import { SessionManager } from "../session/session-manager";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 1800000;

    private sessionManager: SessionManager;

    private channelId: Long;

    private openLinkId: Long | undefined;

    private lastChat: Chat | null;

    private channelInfo: ChannelInfo;

    constructor(sessionManager: SessionManager, channelId: Long, roomType?: ChatroomType, openLinkId?: Long) {
        super();
        this.sessionManager = sessionManager;

        this.channelId = channelId;

        this.openLinkId = openLinkId;

        this.channelInfo = this.createChannelInfo(roomType || ChatroomType.GROUP);
        this.lastChat = null;
    }

    protected createChannelInfo(roomType: ChatroomType): ChannelInfo {
        return new ChannelInfo(this, roomType);
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

    get LastInfoUpdate() {
        return this.channelInfo.LastInfoUpdated;
    }

    get IsOpenChat() {
        return this.channelInfo.RoomType === ChatroomType.OPENCHAT_DIRECT || this.channelInfo.RoomType === ChatroomType.OPENCHAT_GROUP;
    }

    get OpenLinkId() {
        return this.openLinkId;
    }

    get ChannelInfo() {
        return this.channelInfo;
    }

    getNextMessageId(): number {
        if (this.lastChat) {
            return this.lastChat.MessageId + 1;
        }

        return 0;
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

    // NOTE This send as combined 1 text message
    async sendText(...textFormat: (string | ChatContent)[]): Promise<Chat> {
        let text = '';

        if (textFormat.length < 1) {
            throw new Error('Text is empty');
        }

        let mentionPrefix = '@';
        let mentionMap: Map<string, MentionContentList> = new Map();

        let mentionCount = 1;
        let len = textFormat.length;
        for (let i = 0; i < len; i++) { // TODO: Better format parsing
            let fragment = textFormat[i];

            let type = typeof(fragment);

            if (type === 'string') {
                text += fragment;
            } else if (type === 'object') {
                let content = fragment as ChatContent;
                switch (content.ContentType) {
                    case 'mention': {
                        let mentionContent = content as ChatMention;

                        let mentionContentList = mentionMap.get(mentionContent.User.UserId.toString());
                        let nickname = mentionContent.User.UserInfo.Nickname || 'unknown';

                        if (!mentionContentList) {
                            mentionContentList = new MentionContentList(mentionContent.User.UserId, nickname.length);

                            mentionMap.set(mentionContent.User.UserId.toString(), mentionContentList);
                        }

                        mentionContentList.IndexList.push(mentionCount++);

                        text += `${mentionPrefix}${nickname}`;
                        break;
                    }

                    default: throw new Error(`Unknownt ChatContent ${fragment} at format index:${i}`);
                }

            } else {
                throw new Error(`Unknownt type ${typeof(fragment)} at format index:${i}`);
            }
        }

        if (text === '') {
            throw new Error('Text is empty');
        }

        let extra: any = {};

        let mentionMapValues = mentionMap.values();
        let mentions: any[] = [];
        for (let mentionList of mentionMapValues) {
            mentions.push(mentionList.toRawContent());
        }

        if (mentions.length > 0) {
            extra['mentions'] = mentions;
        }

        let extraText = JsonUtil.stringifyLoseless(extra);

        return new Promise((resolve, reject) => {
            let packet = new PacketMessageWriteReq(this.getNextMessageId(), this.channelId, text, MessageType.Text, false, extraText).once('response', (res: PacketMessageWriteRes) => {
                let chat = this.sessionManager.chatFromChatlog(new ChatlogStruct(res.LogId, res.PrevLogId, this.channelInfo.ChannelClientUser.UserId, this.channelId, MessageType.Text, text, Math.floor(Date.now() / 1000), extraText, res.MessageId));
                resolve(chat);
            });

            this.sessionManager.Client.NetworkManager.sendPacket(packet);
        });
    }

    async sendTemplate(template: MessageTemplate): Promise<Chat> {
        return new Promise((resolve, reject) => {
            if (!template.Valid) {
                reject('Invalid template');
                return;
            }

            let sentType = template.getMessageType();
            let text = template.getPacketText();
            let extra = template.getPacketExtra();

            let packet = new PacketMessageWriteReq(this.getNextMessageId(), this.channelId, text, sentType, false, extra).once('response', (res: PacketMessageWriteRes) => {
                let chat = this.SessionManager.chatFromChatlog(new ChatlogStruct(res.LogId, res.PrevLogId, this.channelInfo.ChannelClientUser.UserId, this.channelId, sentType, template.getPacketText(), Math.floor(Date.now() / 1000), extra, res.MessageId));

                resolve(chat);
            });

            this.SessionManager.Client.NetworkManager.sendPacket(packet);
        });
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

    private openChatToken: number;

    private activeUserList: MemberStruct[];

    private localUserMap: Map<string, ChatUser>;

    private pendingInfoReq: Promise<void> | null;
    private pendingUserInfoReq: Promise<void> | null;

    constructor(channel: ChatChannel, roomType: ChatroomType) {
        this.channel = channel;
        this.infoLoaded = false;
        this.memberListLoaded = false;

        this.roomType = roomType;

        this.openChatToken = -1;

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

    get OpenChatToken() {
        return this.openChatToken;
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

    addUserJoined(userId: Long, joinMessage: string): ChatUser {
        let newUser = this.addUserInternal(userId);

        this.channel.emit('join', newUser, joinMessage);
        this.channel.Client.emit('user_join', this.channel, newUser, joinMessage);

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

        if (openLinkInfo) {
            this.updateRoomName(openLinkInfo.LinkName);
            this.openChatToken = openLinkInfo.OpenToken;
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

        if (!this.infoLoaded) {
            this.infoLoaded = true;
        }

        this.lastInfoUpdated = Date.now();
    }

    updateRoomName(name: string) {
        this.name = name;
    }

    initMemberList(memberList: MemberStruct[]): ChatUser[] {
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

    updateMemberList(memberList: MemberStruct[]): ChatUser[] {
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

        let resolver: () => void;
        this.pendingInfoReq = new Promise((resolve, reject) => {resolver = resolve});

        let networkManager = this.channel.Client.NetworkManager;

        let info = await networkManager.requestChannelInfo(this.channel.ChannelId);
        let openInfo: OpenLinkStruct | undefined = undefined;

        if (info.Type == ChatroomType.OPENCHAT_GROUP || info.Type == ChatroomType.OPENCHAT_DIRECT) {
            openInfo = (await networkManager.requestOpenChatInfo(info.OpenLinkId!))[0];
        }

        await this.updateMemberInfo(info);

        this.updateFromStruct(info, openInfo);

        resolver!();
    }

    async updateMemberInfo(chatInfo: ChatInfoStruct): Promise<void> {
        if (this.pendingUserInfoReq) return this.pendingUserInfoReq;

        let resolver: () => void;
        this.pendingUserInfoReq = new Promise((resolve, reject) => {resolver = resolve});

        let networkManager = this.channel.Client.NetworkManager;

        let infoList = await networkManager.requestMemberInfo(this.channel.ChannelId);
        let activeInfoList = await networkManager.requestSpecificMemberInfo(this.channel.ChannelId, chatInfo.MemberList.map((item) => item.UserId));
        
        this.initMemberList(infoList.slice().concat(activeInfoList));

        resolver!();
    }

}