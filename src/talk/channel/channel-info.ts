/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatUser, UserInfo } from "../user/chat-user";
import { ChannelMetaStruct, ChannelMetaType, ChatInfoStruct } from "../struct/chat-info-struct";
import { Long } from "bson";
import { MemberStruct } from "../struct/member-struct";
import { ChannelType } from "../chat/channel-type";
import { ChatChannel, OpenChatChannel } from "./chat-channel";
import { OpenMemberType } from "../open/open-member-type";
import { OpenLinkStruct } from "../struct/open-link-struct";


export class ChannelInfo {

    private channel: ChatChannel;

    private roomType: ChannelType;

    private lastInfoUpdated: number;

    private roomImageURL: string;
    private roomFullImageURL: string;

    private name: string;

    private isFavorite: boolean;

    private isDirectChan: boolean;

    private chatmetaList: ChannelMetaStruct[];

    private activeUserList: MemberStruct[];

    private userInfoMap: Map<string, UserInfo>;

    private clientUserInfo: UserInfo;

    private pendingInfoReq: Promise<void> | null;
    private pendingUserInfoReq: Promise<void> | null;

    constructor(channel: ChatChannel) {
        this.channel = channel;

        this.roomType = ChannelType.UNKNOWN;

        this.lastInfoUpdated = -1;

        this.activeUserList = [];
        this.userInfoMap = new Map();

        this.roomImageURL = '';
        this.roomFullImageURL = '';

        this.name = '';
        this.isFavorite = false;

        this.chatmetaList = [];
        this.isDirectChan = false;

        this.pendingInfoReq = this.pendingUserInfoReq = null;
        
        this.clientUserInfo = new UserInfo(this.channel.Client.ClientUser);
    }

    get Channel() {
        return this.channel;
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

    get IsDirectChan() {
        return this.isDirectChan;
    }

    get LastInfoUpdated() {
        return this.lastInfoUpdated;
    }

    get UserIdList(): Long[] {
        return Array.from(this.userInfoMap.keys()).map(strLong => Long.fromString(strLong));
    }

    get ChatMetaList() {
        return this.chatmetaList;
    }

    hasUserInfo(id: Long) {
        return this.userInfoMap.has(id.toString()) || this.Channel.Client.ClientUser.Id.equals(id);
    }

    get ClientUserInfo(): UserInfo {
        return this.clientUserInfo;
    }

    getUserInfo(user: ChatUser): UserInfo | null {
        return this.getUserInfoId(user.Id);
    }

    getUserInfoId(id: Long): UserInfo | null {
        if (this.Channel.Client.ClientUser.Id.equals(id)) {
            return this.ClientUserInfo;
        }

        if (!this.hasUserInfo(id)) {
            return null;
        }

        return this.userInfoMap.get(id.toString())!;
    }

    async addUserJoined(userId: Long): Promise<void> {
        if (this.hasUserInfo(userId) || this.channel.Client.ClientUser.Id.equals(userId)) {
            throw new Error('This user already joined');
        }

        let newUser = this.channel.Client.UserManager.get(userId);

        let info = new UserInfo(newUser);
        info.updateFromStruct((await this.channel.Client.NetworkManager.requestSpecificMemberInfo(this.channel.Id, [ userId ]))[0]);

        this.userInfoMap.set(userId.toString(), info);
    }

    removeUserLeft(id: Long): boolean {
        if (this.channel.Client.ClientUser.Id.equals(id)) {
            throw new Error('Client user cannot be removed');
        }

        return this.userInfoMap.delete(id.toString());
    }

    updateFromStruct(chatinfoStruct: ChatInfoStruct) {
        this.activeUserList = chatinfoStruct.MemberList;

        this.isDirectChan = chatinfoStruct.IsDirectChat;
        this.chatmetaList = chatinfoStruct.ChatMetaList;

        for (let meta of this.chatmetaList) {
            if (meta.Type === ChannelMetaType.TITLE) {
                this.updateRoomName(meta.Content);
            }
        }

        this.roomImageURL = chatinfoStruct.Metadata.ImageURL;
        this.roomFullImageURL = chatinfoStruct.Metadata.FullImageURL;

        this.isFavorite = chatinfoStruct.Metadata.Favorite;

        this.roomType = chatinfoStruct.Type;

        this.lastInfoUpdated = Date.now();
    }

    protected updateRoomName(name: string) {
        this.name = name;
    }

    protected async initUserInfoList(memberList: MemberStruct[]) {
        this.userInfoMap.clear();

        for (let memberStruct of memberList) {
            this.initUserInfo(memberStruct);
        }
    }

    protected initUserInfo(memberStruct: MemberStruct) {
        let info = new UserInfo(this.channel.Client.UserManager.get(memberStruct.UserId));
        info.updateFromStruct(memberStruct);

        this.userInfoMap.set(memberStruct.UserId.toString(), info);
    }

    async updateInfo(): Promise<void> {
        if (this.pendingInfoReq) return this.pendingInfoReq;

        let resolver: () => void | null;
        this.pendingInfoReq = new Promise((resolve, reject) => resolver = resolve);

        let networkManager = this.channel.Client.NetworkManager;

        let info = await networkManager.requestChannelInfo(this.channel.Id);

        await this.updateMemberInfo(info);

        this.updateFromStruct(info);

        resolver!();
    }

    protected async updateMemberInfo(chatInfo: ChatInfoStruct): Promise<void> {
        if (this.pendingUserInfoReq) return this.pendingUserInfoReq;

        let resolver: () => void | null;
        this.pendingUserInfoReq = new Promise((resolve, reject) => resolver = resolve);

        let networkManager = this.channel.Client.NetworkManager;

        let infoList = await networkManager.requestMemberInfo(this.channel.Id);
        let activeInfoList = await networkManager.requestSpecificMemberInfo(this.channel.Id, chatInfo.MemberList.map((item) => item.UserId));
        
        await this.initUserInfoList(infoList.slice().concat(activeInfoList));

        resolver!();
    }

}

export class OpenChannelInfo extends ChannelInfo {
    
    private linkInfo: OpenLinkStruct = new OpenLinkStruct();

    private memberTypeMap: Map<string, OpenMemberType> = new Map();

    get Channel(): OpenChatChannel {
        return super.Channel as OpenChatChannel;
    }

    get CoverURL() {
        return this.linkInfo.CoverURL;
    }

    get LinkURL() {
        return this.linkInfo.LinkURL;
    }

    get LinkOwner(): ChatUser {
        return this.Channel.Client.UserManager.get(this.linkInfo.Owner.UserId);
    }

    canManageChannel(user: ChatUser) {
        return this.canManageChannelId(user.Id);
    }

    canManageChannelId(userId: Long) {
        return this.isManagerId(userId) || userId.equals(this.LinkOwner.Id);
    }

    isManager(user: ChatUser) {
        return this.isManagerId(user.Id);
    }

    isManagerId(userId: Long) {
        return this.getMemberTypeId(userId) === OpenMemberType.MANAGER;
    }

    protected initUserInfo(memberStruct: MemberStruct) {
        super.initUserInfo(memberStruct);

        this.memberTypeMap.set(memberStruct.UserId.toString(), memberStruct.OpenChatMemberType);
    }

    getMemberType(user: ChatUser): OpenMemberType {
        return this.getMemberTypeId(user.Id);
    }

    getMemberTypeId(userId: Long): OpenMemberType {
        if (!this.hasUserInfo(userId)) OpenMemberType.NONE;

        return this.memberTypeMap.get(userId.toString())!;
    }

    async updateFromStruct(chatinfoStruct: ChatInfoStruct): Promise<void> {
        super.updateFromStruct(chatinfoStruct);

        let openLinkInfo = (await this.Channel.Client.OpenChatManager.get(this.Channel.LinkId));

        this.updateRoomName(openLinkInfo.LinkName);
        
        this.linkInfo = openLinkInfo;
    }
    
}