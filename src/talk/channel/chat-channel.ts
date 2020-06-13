import { ChatUser } from "../user/chat-user";
import { Long } from "bson";
import { ChannelType } from "./channel-type";
import { EventEmitter } from "events";
import { Chat } from "../chat/chat";
import { MessageTemplate } from "../chat/template/message-template";
import { OpenLinkStruct } from "../struct/open/open-link-struct";
import { ChatContent } from "../chat/attachment/chat-attachment";
import { ChatFeed } from "../chat/chat-feed";
import { ChannelInfo, OpenChannelInfo } from "./channel-info";
import { LocoClient } from "../../client";
import { OpenMemberType, OpenProfileType } from "../open/open-link-type";
import { StatusCode } from "../../packet/loco-packet-base";
import { ChannelMetaType, PrivilegeMetaContent, ProfileMetaContent, TvMetaContent, TvLiveMetaContent, LiveTalkCountMetaContent, GroupMetaContent } from "../struct/channel-meta-struct";
import { ChannelSettings } from "./channel-settings";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatChannel {

    readonly Client: LocoClient;

    readonly LastChat: Chat | null;

    readonly Id: Long;

    readonly Type: ChannelType;

    readonly PushAlert: boolean;

    isOpenChat(): boolean;

    markChannelRead(lastWatermark: Long): Promise<void>;

    sendText(...textFormat: (string | ChatContent)[]): Promise<Chat | null>;
    
    sendTemplate(template: MessageTemplate): Promise<Chat | null>;

    leave(block?: boolean): Promise<boolean>;

    updateChannelSettings(pushAlert: boolean): Promise<boolean>;

    setTitleMeta(title: string): Promise<boolean>;

    setNoticeMeta(notice: string): Promise<boolean>;

    setPrivilegeMeta(content: PrivilegeMetaContent): Promise<boolean>;

    setProfileMeta(content: ProfileMetaContent): Promise<boolean>;

    setTvMeta(content: TvMetaContent): Promise<boolean>;

    setTvLiveMeta(content: TvLiveMetaContent): Promise<boolean>;

    setLiveTalkCountMeta(content: LiveTalkCountMetaContent): Promise<boolean>;

    setGroupMeta(content: GroupMetaContent): Promise<boolean>;

    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'join', listener: (newUser: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'left', listener: (leftUser: ChatUser, feed: ChatFeed) => void): this;

    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'join', listener: (newUser: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'left', listener: (leftUser: ChatUser, feed: ChatFeed) => void): this;

}

export interface OpenChatChannel extends ChatChannel {

    readonly LinkId: Long;

    readonly OpenToken: number;

    async kickMember(user: ChatUser): Promise<boolean>;

    kickMemberId(userId: Long): Promise<boolean>;

    deleteLink(): Promise<boolean>;

    hideChat(chat: Chat): Promise<boolean>;

    hideChatId(logId: Long): Promise<boolean>;

    changeToMainProfile(): Promise<boolean>;

    changeToKakaoProfile(nickname: string, profilePath: string): Promise<boolean>;

    changeToLinkProfile(profileLinkId: Long): Promise<boolean>;

    setOpenMemberType(user: ChatUser, memberType: OpenMemberType): Promise<boolean>;

    setOpenMemberTypeId(userId: Long, memberType: OpenMemberType): Promise<boolean>;

    getOpenProfile(): Promise<OpenLinkStruct>;

}

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 300000;

    private lastChat: Chat | null;

    private readonly channelInfo: ChannelInfo;

    constructor(private client: LocoClient, private id: Long, private type: ChannelType, private pushAlert: boolean) {
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

    get PushAlert() {
        return this.pushAlert;
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

    async sendText(...textFormat: (string | ChatContent)[]): Promise<Chat | null> {
        return this.client.ChatManager.sendText(this, ...textFormat);
    }
    
    async sendTemplate(template: MessageTemplate): Promise<Chat | null> {
        return this.client.ChatManager.sendTemplate(this, template);
    }

    async leave(block: boolean = false): Promise<boolean> {
        return this.client.ChannelManager.leave(this, block);
    }

    async updateChannelSettings(settings: ChannelSettings): Promise<boolean> {
        return this.client.ChannelManager.updateChannelSettings(this, settings);
    }

    async setTitleMeta(title: string): Promise<boolean> {
        return this.client.ChannelManager.setTitleMeta(this, title);
    }

    async setNoticeMeta(notice: string): Promise<boolean> {
        return this.client.ChannelManager.setNoticeMeta(this, notice);
    }

    async setPrivilegeMeta(content: PrivilegeMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setPrivilegeMeta(this, content);
    }

    async setProfileMeta(content: ProfileMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setProfileMeta(this, content);
    }

    async setTvMeta(content: TvMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setTvMeta(this, content);
    }

    async setTvLiveMeta(content: TvLiveMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setTvLiveMeta(this, content);
    }

    async setLiveTalkCountMeta(content: LiveTalkCountMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setLiveTalkCountMeta(this, content);
    }

    async setGroupMeta(content: GroupMetaContent): Promise<boolean> {
        return this.client.ChannelManager.setGroupMeta(this, content);
    }

    updateChannel(settings: ChannelSettings) {
        this.pushAlert = settings.pushAlert || false;
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

    constructor(client: LocoClient, channelId: Long, type: ChannelType, pushAlert: boolean, private linkId: Long, private openToken: number) {
        super(client, channelId, type, pushAlert);
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

        return this.Client.OpenLinkManager.kickMember(this, userId);
    }

    async deleteLink(): Promise<boolean> {
        if (!(await this.getChannelInfo()).LinkOwner.isClientUser()) return false;

        return this.Client.OpenLinkManager.deleteLink(this.linkId);
    }

    async hideChat(chat: Chat) {
        return this.hideChatId(chat.LogId);
    }

    async hideChatId(logId: Long) {
        if (!(await this.getChannelInfo()).canManageChannel(this.Client.ClientUser)) return false;

        return this.Client.OpenLinkManager.hideChat(this, logId);
    }

    async changeToMainProfile(): Promise<boolean> {
        return this.Client.OpenLinkManager.changeProfile(this, OpenProfileType.MAIN);
    }

    async changeToKakaoProfile(nickname: string, profilePath: string): Promise<boolean> {
        return this.Client.OpenLinkManager.changeProfile(this, OpenProfileType.KAKAO_ANON, nickname, profilePath);
    }

    async changeToLinkProfile(profileLinkId: Long): Promise<boolean> {
        return this.Client.OpenLinkManager.changeProfile(this, OpenProfileType.OPEN_PROFILE, profileLinkId);
    }

    async setOpenMemberType(user: ChatUser, memberType: OpenMemberType) {
        return this.setOpenMemberTypeId(user.Id, memberType);
    }

    async setOpenMemberTypeId(userId: Long, memberType: OpenMemberType): Promise<boolean> {
        if (!(await this.getChannelInfo()).hasUserInfo(userId)) return false;

        return this.Client.OpenLinkManager.setOpenMemberType(this, userId, memberType);
    }

    async getOpenProfile(): Promise<OpenLinkStruct> {
        return this.Client.OpenLinkManager.get(this.linkId);
    }

}