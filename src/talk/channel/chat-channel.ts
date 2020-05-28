import { ChatUser } from "../user/chat-user";
import { Long } from "bson";
import { ChannelType } from "../chat/channel-type";
import { EventEmitter } from "events";
import { Chat } from "../chat/chat";
import { PacketMessageWriteReq, PacketMessageWriteRes } from "../../packet/packet-message";
import { ChatType } from "../chat/chat-type";
import { MessageTemplate } from "../chat/template/message-template";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { ChatContent } from "../chat/attachment/chat-attachment";
import { ChatBuilder } from "../chat/chat-builder";
import { PacketMessageNotiReadReq } from "../../packet/packet-noti-read";
import { ChatFeed } from "../chat/chat-feed";
import { JsonUtil } from "../../util/json-util";
import { ChannelInfo, OpenChannelInfo } from "./channel-info";
import { LocoClient } from "../../client";
import { OpenMemberType, OpenchatProfileType } from "../open/open-link-type";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 300000;

    private lastChat: Chat | null;

    private readonly channelInfo: ChannelInfo;

    constructor(private client: LocoClient, private id: Long, private type: ChannelType) {
        super();

        this.channelInfo = this.createChannelInfo();
        this.lastChat = null;
    }

    protected createChannelInfo(): ChannelInfo {
        return new ChannelInfo(this);
    }

    get Client() {
        return this.client;
    }

    get LastChat() {
        return this.lastChat;
    }

    get Id() {
        return this.id;
    }

    get Type() {
        return this.type;
    }

    async getChannelInfo(forceUpdate: boolean = false) {
        if (forceUpdate || this.channelInfo.LastInfoUpdated + ChatChannel.INFO_UPDATE_INTERVAL <= Date.now()) {
            await this.channelInfo.updateInfo();
        }

        return this.channelInfo;
    }

    chatReceived(chat: Chat) {
        this.lastChat = chat;

        this.emit('message', chat);
        this.client.emit('message', chat);
    }

    async markChannelRead(lastWatermark: Long) {
        await this.Client.ChannelManager.markRead(this, lastWatermark);
    }

    async sendText(...textFormat: (string | ChatContent)[]): Promise<Chat> {
        let { text, extra } = ChatBuilder.buildMessage(...textFormat);

        let extraText = JsonUtil.stringifyLoseless(extra);
        
        let res = await this.client.LocoInterface.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.client.ChatManager.getNextMessageId(), this.id, text, ChatType.Text, false, extraText));
        
        return this.client.ChatManager.chatFromChatlog({
            logId: res.LogId,
            prevLogId: res.PrevLogId,
            senderId: this.client.ClientUser.Id,
            channelId: this.id,
            type: ChatType.Text,
            text: text,
            sendTime: Math.floor(Date.now() / 1000),
            rawAttachment: extraText,
            messageId: res.MessageId
        });
    }
    
    async sendTemplate(template: MessageTemplate): Promise<Chat> {
        if (!template.Valid) {
            throw new Error('Invalid template');
        }

        let sentType = template.getMessageType();
        let text = template.getPacketText();
        let extra = template.getPacketExtra();

        let res = await this.client.LocoInterface.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.client.ChatManager.getNextMessageId(), this.id, text, sentType, false, extra));

        return this.client.ChatManager.chatFromChatlog({
            logId: res.LogId,
            prevLogId: res.PrevLogId,
            senderId: this.client.ClientUser.Id,
            channelId: this.id,
            type: ChatType.Text,
            text: text,
            sendTime: Math.floor(Date.now() / 1000),
            rawAttachment: extra,
            messageId: res.MessageId
        });
    }

    async leave(block: boolean = false): Promise<boolean> {
        return this.client.ChannelManager.leave(this, block);
    }

    isOpenChat(): boolean {
        return false;
    }

    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'join', listener: (newUser: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'left', listener: (leftUser: ChatUser, feed: ChatFeed) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'join', listener: (newUser: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'left', listener: (leftUser: ChatUser, feed: ChatFeed) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}

export class OpenChatChannel extends ChatChannel {

    constructor(client: LocoClient, channelId: Long, type: ChannelType, private linkId: Long, private openToken: number) {
        super(client, channelId, type);
    }

    protected createChannelInfo(): OpenChannelInfo {
        return new OpenChannelInfo(this);
    }
    
    async getChannelInfo(forceUpdate: boolean = false): Promise<OpenChannelInfo> {
        return super.getChannelInfo(forceUpdate) as Promise<OpenChannelInfo>;
    }

    get LinkId() {
        return this.linkId;
    }

    get OpenToken() {
        return this.openToken;
    }

    isOpenChat(): boolean {
        return true;
    }

    async kickMember(user: ChatUser): Promise<boolean> {
        return this.kickMemberId(user.Id);
    }

    async kickMemberId(userId: Long): Promise<boolean> {
        if (!(await this.getChannelInfo()).canManageChannel(this.Client.ClientUser)) return false;

        return this.Client.OpenChatManager.kickMember(this, userId);
    }

    async deleteLink(): Promise<boolean> {
        if (!(await this.getChannelInfo()).LinkOwner.isClientUser()) return false;

        return this.Client.OpenChatManager.deleteLink(this.linkId);
    }

    async hideChat(chat: Chat) {
        return this.hideChatId(chat.LogId);
    }

    async hideChatId(logId: Long) {
        if (!(await this.getChannelInfo()).canManageChannel(this.Client.ClientUser)) return false;

        return this.Client.OpenChatManager.hideChat(this, logId);
    }

    async changeToMainProfile(): Promise<boolean> {
        return this.Client.OpenChatManager.changeProfile(this, OpenchatProfileType.MAIN);
    }

    async changeToKakaoProfile(nickname: string, profilePath: string): Promise<boolean> {
        return this.Client.OpenChatManager.changeProfile(this, OpenchatProfileType.KAKAO_ANON, nickname, profilePath);
    }

    async changeToLinkProfile(profileLinkId: Long): Promise<boolean> {
        return this.Client.OpenChatManager.changeProfile(this, OpenchatProfileType.OPEN_PROFILE, profileLinkId);
    }

    async setOpenMemberType(user: ChatUser, memberType: OpenMemberType) {
        return this.setOpenMemberTypeId(user.Id, memberType);
    }

    async setOpenMemberTypeId(userId: Long, memberType: OpenMemberType): Promise<boolean> {
        if (!(await this.getChannelInfo()).hasUserInfo(userId)) return false;

        return this.Client.OpenChatManager.setOpenMemberType(this, userId, memberType);
    }

    async getOpenProfile(): Promise<OpenLinkStruct> {
        return this.Client.OpenChatManager.get(this.linkId);
    }

}