/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkChannel } from "../open/open-link";
import { OpenMemberStruct, OpenLinkReactionInfo, LinkReactionType } from "../struct/open/open-link-struct";
import { ChatUser, ChatUserInfo, OpenChatUserInfo, DisplayUserInfo, NormalChatUserInfo } from "../user/chat-user";
import { OpenMemberType } from "../open/open-link-type";
import { Long } from "bson";
import { PrivilegeMetaContent, ProfileMetaContent, TvMetaContent, TvLiveMetaContent, ChannelMetaStruct, GroupMetaContent, LiveTalkCountMetaContent, ChannelMetaType, ChannelClientMetaStruct, BotMetaContent } from "../struct/channel-meta-struct";
import { ChatContent } from "../chat/attachment/chat-attachment";
import { MessageTemplate } from "../chat/template/message-template";
import { Chat } from "../chat/chat";
import { ChatType } from "../chat/chat-type";
import { ChannelSettings } from "../channel/channel-settings";
import { ChannelManager } from "../channel/channel-manager";
import { ChannelDataStruct } from "../struct/channel-data-struct";
import { EventEmitter } from "events";
import { ChatChannel, OpenChatChannel, MemoChatChannel, NormalChatChannel } from "../channel/chat-channel";
import { MemberStruct, DisplayMemberStruct } from "../struct/member-struct";
import { ManagedOpenChatUserInfo, ManagedChatUserInfo } from "./managed-chat-user";
import { RequestResult } from "../request/request-result";
import { OpenProfileTemplates } from "../open/open-link-profile-template";
import { MediaTemplates } from "../chat/template/media-template";

export class ManagedChatChannel extends EventEmitter implements ChatChannel {

    private lastChat: Chat | null;

    private roomImageURL: string;
    private roomFullImageURL: string;

    private clientRoomImageURL: string;
    private clientRoomFullImageURL: string;

    private clientName: string;

    private clientPushSound: boolean | null;

    private isFavorite: boolean;

    private metaMap: Map<ChannelMetaType, ChannelMetaStruct>;

    private displayUserInfoList: ManagedDisplayUserInfo[];

    private userInfoMap: Map<string, ChatUserInfo>;

    constructor(private manager: ChannelManager, private id: Long, private dataStruct: ChannelDataStruct) {
        super();

        this.roomImageURL = '';
        this.roomFullImageURL = '';
        this.lastChat = null;

        this.clientRoomImageURL = '';
        this.clientRoomFullImageURL = '';

        this.clientName = '';
        this.clientPushSound = null;
        this.isFavorite = false;

        this.displayUserInfoList = [];

        this.userInfoMap = new Map();

        this.metaMap = new Map();
    }

    get Client() {
        return this.manager.Client;
    }

    get ChannelManager() {
        return this.manager;
    }

    get ChatManager() {
        return this.Client.ChatManager;
    }

    get LastChat() {
        return this.lastChat;
    }

    get Id() {
        return this.id;
    }

    get Type() {
        return this.dataStruct.type;
    }

    get PushAlert() {
        return this.dataStruct.pushAlert;
    }

    get Name() {
        let titleMeta = this.metaMap.get(ChannelMetaType.TITLE);
        return titleMeta ? titleMeta.content : '';
    }

    get IsFavorite() {
        return this.isFavorite;
    }

    get RoomImageURL() {
        return this.roomImageURL;
    }

    get RoomFullImageURL() {
        return this.roomFullImageURL;
    }

    get ClientName() {
        return this.clientName;
    }

    get ClientRoomImageURL() {
        return this.clientRoomImageURL;
    }

    get ClientRoomFullImageURL() {
        return this.clientRoomFullImageURL;
    }

    get ChannelMetaList() {
        return Array.from(this.metaMap.values());
    }

    get DisplayUserInfoList() {
        return this.displayUserInfoList;
    }

    // include client user
    get UserCount() {
        return this.userInfoMap.size + 1;
    }

    getDisplayName(): string {
        let name = this.clientName || this.Name;

        if (!name) {
            let size = Math.min(5, this.displayUserInfoList.length);
            name = this.displayUserInfoList.slice(0, size).map(info => info.Nickname).join(', ');

            if (size > this.displayUserInfoList.length) name += ', ...';
        }

        return name;
    }

    getDisplayProfileList(): string[] {
        if (this.clientRoomImageURL) return [ this.clientRoomImageURL ];

        let size = Math.min(4, this.displayUserInfoList.length);
        return this.displayUserInfoList.slice(0, size).map(info => info.ProfileImageURL);
    }

    getUserInfoList() {
        return Array.from(this.userInfoMap.values());
    }

    hasUserInfo(id: Long) {
        return this.userInfoMap.has(id.toString());
    }

    getUserInfoId(id: Long): ChatUserInfo | null {
        let info = this.getUserInfoIdMap(id);

        if (!info && this.Client.ClientUser.Id.equals(id)) return this.Client.ClientUser.MainUserInfo;

        return info;
    }

    getManagedUserInfo(user: ChatUser): ManagedChatUserInfo | ManagedOpenChatUserInfo | null {
        return this.getManagedUserInfoId(user.Id);
    }

    getManagedUserInfoId(id: Long): ManagedChatUserInfo | ManagedOpenChatUserInfo | null {
        return this.getUserInfoIdMap(id) as ManagedChatUserInfo | ManagedOpenChatUserInfo || null;
    }

    getUserInfo(user: ChatUser): ChatUserInfo | null {
        return this.getUserInfoId(user.Id);
    }

    async chatON(): Promise<RequestResult<boolean>> {
        return this.manager.sendChatOn(this);
    }

    async getLatestUserInfoId(id: Long): Promise<ChatUserInfo | null> {
        let latest = await this.Client.UserManager.requestUserInfo(this, id);

        if (latest.result) {
            this.updateUserInfo(id, latest.result);

            return latest.result;
        }

        return null;
    }

    async getLatestUserInfo(user: ChatUser) {
        return this.getLatestUserInfoId(user.Id);
    }

    protected getUserInfoIdMap(id: Long) {
        return this.userInfoMap.get(id.toString()) || null;
    }

    getChannelMeta(type: ChannelMetaType): ChannelMetaStruct | null {
        return this.metaMap.get(type) || null;
    }

    hasChannelMeta(type: ChannelMetaType): boolean {
        return this.metaMap.has(type);
    }

    async markChannelRead(lastWatermark: Long) {
        await this.manager.markRead(this, lastWatermark);
    }

    async sendText(...textFormat: (string | ChatContent)[]): Promise<Chat | null> {
        return this.ChatManager.sendText(this, ...textFormat);
    }

    async sendMedia(template: MediaTemplates): Promise<Chat | null> {
        return this.ChatManager.sendMedia(this, template);
    }
    
    async sendTemplate(template: MessageTemplate): Promise<Chat | null> {
        return this.ChatManager.sendTemplate(this, template);
    }

    async leave(block: boolean = false): Promise<RequestResult<boolean>> {
        return this.manager.leave(this, block);
    }

    async setChannelSettings(settings: ChannelSettings): Promise<RequestResult<boolean>> {
        return this.manager.updateChannelSettings(this, settings);
    }

    async setTitleMeta(title: string): Promise<RequestResult<boolean>> {
        return this.manager.setTitleMeta(this, title);
    }

    async setNoticeMeta(notice: string): Promise<RequestResult<boolean>> {
        return this.manager.setNoticeMeta(this, notice);
    }

    async setPrivilegeMeta(content: PrivilegeMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setPrivilegeMeta(this, content);
    }

    async setProfileMeta(content: ProfileMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setProfileMeta(this, content);
    }

    async setTvMeta(content: TvMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setTvMeta(this, content);
    }

    async setTvLiveMeta(content: TvLiveMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setTvLiveMeta(this, content);
    }

    async setLiveTalkCountMeta(content: LiveTalkCountMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setLiveTalkCountMeta(this, content);
    }

    async setGroupMeta(content: GroupMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setGroupMeta(this, content);
    }

    async setBotMeta(content: BotMetaContent): Promise<RequestResult<boolean>> {
        return this.manager.setBotMeta(this, content);
    }

    updateData(dataStruct: ChannelDataStruct) {
        this.dataStruct = dataStruct;
    }

    updateMetaList(metaList: ChannelMetaStruct[]) {
        for (let meta of metaList) {
            this.updateMeta(meta.type, meta);
        }
    }

    updateMeta(type: ChannelMetaType, meta: ChannelMetaStruct | null) {
        if (!meta) {
            this.metaMap.delete(type);
            return;
        }

        this.metaMap.set(type, meta);

        if (meta.type === ChannelMetaType.PROFILE) {
            try {
                let content = JSON.parse(meta.content) as ProfileMetaContent;
                
                this.roomImageURL = content.imageUrl;
                this.roomFullImageURL = content.fullImageUrl;
            } catch (e) {

            }
        }
    }

    updateClientMeta(clientMeta: ChannelClientMetaStruct) {
        if (clientMeta.name) this.clientName = clientMeta.name;

        if (clientMeta.imageUrl) this.clientRoomImageURL = clientMeta.imageUrl;
        if (clientMeta.full_image_url) this.clientRoomFullImageURL = clientMeta.full_image_url;

        if (clientMeta.push_sound) this.clientPushSound = clientMeta.push_sound;

        if (clientMeta.favorite) this.isFavorite = clientMeta.favorite;
    }

    updateChannelSettings(settings: ChannelSettings) {
        if (settings.pushAlert) this.dataStruct.pushAlert = settings.pushAlert || true;
    }

    updateLastChat(chat: Chat) {
        this.lastChat = chat;
    }

    updateDisplayUserInfoList(list: ManagedDisplayUserInfo[]) {
        this.displayUserInfoList = list;
    }

    updateUserInfo(userId: Long, userInfo: ChatUserInfo | null) {
        if (userInfo) this.userInfoMap.set(userId.toString(), userInfo);
        else this.userInfoMap.delete(userId.toString());
    }

    updateMemberList(memberList: MemberStruct[]) {
        for (let memberStruct of memberList) {
            let userInfo = this.Client.UserManager.getInfoFromStruct(memberStruct) as ManagedChatUserInfo;
            this.updateUserInfo(userInfo.Id, userInfo);
        }
    }

    isOpenChat(): boolean {
        return false;
    }

}

export class ManagedDisplayUserInfo implements DisplayUserInfo {

    constructor(private user: ChatUser, private displayStruct: DisplayMemberStruct) {

    }

    get Client() {
        return this.user.Client;
    }

    get User() {
        return this.user;
    }

    get Id() {
        return this.displayStruct.userId;
    }

    get Nickname() {
        return this.displayStruct.nickname;
    }

    get ProfileImageURL() {
        return this.displayStruct.profileImageUrl;
    }

    get FullProfileImageURL() {
        return this.displayStruct.profileImageUrl;
    }

    get OriginalProfileImageURL() {
        return this.displayStruct.profileImageUrl;
    }

    isOpenUser() {
        return false;
    }

}

export class ManagedNormalChatChannel extends ManagedChatChannel implements NormalChatChannel {

    getUserInfoList() {
        return super.getUserInfoList() as NormalChatUserInfo[];
    }

    getUserInfo(user: ChatUser): NormalChatUserInfo | null {
        return this.getUserInfoId(user.Id);
    }

    getUserInfoId(id: Long): NormalChatUserInfo | null {
        return super.getUserInfoId(id) as NormalChatUserInfo | null;
    }

    inviteUser(user: ChatUser): Promise<RequestResult<boolean>> {
        return this.ChannelManager.inviteUser(this, user);
    }

    inviteUserId(userId: Long): Promise<RequestResult<boolean>> {
        return this.ChannelManager.inviteUserId(this, userId);
    }

    inviteUserList(userList: ChatUser[]): Promise<RequestResult<boolean>> {
        return this.ChannelManager.inviteUserList(this, userList);
    }

    inviteUserIdList(userIdList: Long[]): Promise<RequestResult<boolean>> {
        return this.ChannelManager.inviteUserIdList(this, userIdList);
    }

    isOpenChat(): false {
        return false;
    }

}

export class ManagedMemoChatChannel extends ManagedChatChannel implements MemoChatChannel {

    getUserInfoList() {
        return super.getUserInfoList() as NormalChatUserInfo[];
    }

    getUserInfo(user: ChatUser): NormalChatUserInfo | null {
        return this.getUserInfoId(user.Id);
    }

    getUserInfoId(id: Long): NormalChatUserInfo | null {
        return super.getUserInfoId(id) as NormalChatUserInfo | null;
    }

    isOpenChat(): false {
        return false;
    }

}

export class ManagedOpenChatChannel extends ManagedChatChannel implements OpenChatChannel {

    //lazy initialization hax
    private clientUserInfo: ManagedOpenChatUserInfo | null;

    constructor(manager: ChannelManager, id: Long, dataStruct: ChannelDataStruct, private linkId: Long, private openToken: number, private openLink: OpenLinkChannel) {
        super(manager, id, dataStruct);

        this.clientUserInfo = null;
    }

    get ClientUserInfo() {
        return this.clientUserInfo!;
    }

    get Name() {
        return super.Name || this.openLink.LinkName;
    }

    get LinkId() {
        return this.linkId;
    }

    get OpenToken() {
        return this.openToken;
    }

    getOpenLink() {
        return this.openLink;
    }

    isOpenChat(): true {
        return true;
    }

    getUserInfoList() {
        return super.getUserInfoList() as OpenChatUserInfo[];
    }

    getUserInfo(user: ChatUser): OpenChatUserInfo | null {
        return this.getUserInfoId(user.Id);
    }

    getUserInfoId(id: Long): OpenChatUserInfo | null {
        if (this.clientUserInfo && this.clientUserInfo.Id.equals(id)) return this.clientUserInfo;

        return super.getUserInfoId(id) as OpenChatUserInfo | null;
    }

    async getLatestUserInfoId(id: Long) {
        return super.getLatestUserInfoId(id) as Promise<OpenChatUserInfo | null>;
    }

    async getLatestUserInfo(user: ChatUser) {
        return super.getLatestUserInfo(user) as Promise<OpenChatUserInfo | null>;
    }

    getManagedUserInfo(user: ChatUser): ManagedOpenChatUserInfo | null {
        return this.getManagedUserInfoId(user.Id);
    }

    getManagedUserInfoId(id: Long): ManagedOpenChatUserInfo | null {
        if (this.clientUserInfo && this.clientUserInfo.Id.equals(id)) return this.clientUserInfo;
        
        return this.getUserInfoIdMap(id) as ManagedOpenChatUserInfo || null;
    }

    getMemberType(user: ChatUser): OpenMemberType {
        return this.getMemberTypeId(user.Id);
    }

    getMemberTypeId(userId: Long): OpenMemberType {
        let info = this.getUserInfoId(userId);

        if (info) return info.MemberType;

        return OpenMemberType.NONE;
    }

    canManageChannel(user: ChatUser) {
        return this.canManageChannelId(user.Id);
    }

    canManageChannelId(userId: Long) {
        return this.isManagerId(userId) || userId.equals(this.openLink.LinkOwnerInfo.Id);
    }

    isManager(user: ChatUser) {
        return this.isManagerId(user.Id);
    }

    isManagerId(userId: Long) {
        return this.getMemberTypeId(userId) === OpenMemberType.MANAGER;
    }

    async kickMember(user: ChatUser): Promise<RequestResult<boolean>> {
        return this.kickMemberId(user.Id);
    }

    async kickMemberId(userId: Long): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.kickMember(this, userId);
    }

    async deleteLink(): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.deleteLink(this.linkId);
    }

    async hideChat(chat: Chat): Promise<RequestResult<boolean>> {
        return this.hideChatIdType(chat.LogId, chat.Type);
    }

    async hideChatId(logId: Long): Promise<RequestResult<boolean>> {
        return this.hideChatIdType(logId, ChatType.Text);
    }

    async hideChatIdType(logId: Long, type: ChatType): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.hideChat(this, logId, type);
    }

    async changeProfile(profile: OpenProfileTemplates): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.changeProfile(this, profile);
    }

    async setOpenMemberType(user: ChatUser, memberType: OpenMemberType.NONE | OpenMemberType.MANAGER | OpenMemberType.BOT) {
        return this.setOpenMemberTypeId(user.Id, memberType);
    }

    async setOpenMemberTypeId(userId: Long, memberType: OpenMemberType.NONE | OpenMemberType.MANAGER | OpenMemberType.BOT): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.setOpenMemberType(this, userId, memberType);
    }

    async handOverHost(newHost: ChatUser): Promise<RequestResult<boolean>> {
        return this.handOverHostId(newHost.Id);
    }

    async handOverHostId(newHostId: Long): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.handOverHost(this, newHostId);
    }

    async requestReactionInfo(): Promise<RequestResult<OpenLinkReactionInfo>> {
        return this.Client.OpenLinkManager.requestReactionInfo(this.linkId);
    }

    async setReacted(reactionType: LinkReactionType): Promise<RequestResult<boolean>> {
        return this.Client.OpenLinkManager.setLinkReacted(this.linkId, reactionType);
    }

    updateLink(link: OpenLinkChannel) {
        this.openLink = link;
    }

    updateOpenMemberList(memberList: OpenMemberStruct[]) {
        memberList.forEach(this.updateOpenMember.bind(this));
    }

    updateOpenMember(memberStruct: OpenMemberStruct) {
        let userInfo = this.Client.UserManager.getInfoFromStruct(memberStruct) as ManagedOpenChatUserInfo;

        if (this.Client.ClientUser.Id.equals(userInfo.Id)) {
            this.clientUserInfo = userInfo;
            return;
        }

        this.updateUserInfo(userInfo.Id, userInfo);
    }

}
