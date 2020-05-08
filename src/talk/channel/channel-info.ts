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
import { OpenLinkStruct, OpenMemberStruct } from "../struct/open-link-struct";
import { PacketChatOnRoomRes, PacketChatOnRoomReq } from "../../packet/packet-chat-on-room";


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

    private userInfoMap: Map<string, UserInfo>;

    private clientUserInfo: UserInfo;

    private pendingInfoReq: Promise<void> | null;
    private pendingUserInfoReq: Promise<void> | null;

    constructor(channel: ChatChannel) {
        this.channel = channel;

        this.roomType = ChannelType.UNKNOWN;

        this.lastInfoUpdated = -1;

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
        if (this.clientUserInfo.User.Id.equals(id)) {
            return this.ClientUserInfo;
        }

        if (!this.hasUserInfo(id)) {
            return null;
        }

        return this.userInfoMap.get(id.toString())!;
    }

    async addUserInfo(userId: Long): Promise<void> {
        if (this.hasUserInfo(userId) || this.channel.Client.ClientUser.Id.equals(userId)) {
            throw new Error('This user already joined');
        }

        this.initUserInfo((await this.channel.Client.UserManager.requestSpecificMemberInfo(this.channel.Id, [ userId ]))[0]);
    }

    removeUserInfo(id: Long): boolean {
        if (this.channel.Client.ClientUser.Id.equals(id)) {
            throw new Error('Client user cannot be removed');
        }

        return this.userInfoMap.delete(id.toString());
    }

    updateFromStruct(chatinfoStruct: ChatInfoStruct) {
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

    protected initUserInfo(memberStruct: MemberStruct) {
        let info = new UserInfo(this.channel.Client.UserManager.get(memberStruct.UserId));
        info.updateFromStruct(memberStruct);

        this.userInfoMap.set(memberStruct.UserId.toString(), info);
    }

    async updateInfo(): Promise<void> {
        if (this.pendingInfoReq) return this.pendingInfoReq;

        let resolver: () => void | null;
        this.pendingInfoReq = new Promise((resolve, reject) => resolver = resolve);

        let info = await this.Channel.Client.ChannelManager.requestChannelInfo(this.channel.Id);

        await this.updateMemberInfo();

        this.updateFromStruct(info);

        resolver!();
    }

    protected updateFromChatOnRoom(res: PacketChatOnRoomRes) {
        for (let memberStruct of res.MemberList) {
            if (this.clientUserInfo.User.Id.equals(memberStruct.UserId)) {
                this.clientUserInfo.updateFromStruct(memberStruct);
                continue;
            }

            this.initUserInfo(memberStruct);
        }
    }

    protected async updateMemberInfo(): Promise<void> {
        if (this.pendingUserInfoReq) return this.pendingUserInfoReq;

        let resolver: () => void | null;
        this.pendingUserInfoReq = new Promise((resolve, reject) => resolver = resolve);

        this.userInfoMap.clear();

        let res = await this.channel.Client.ChannelManager.requestChatOnRoom(this.channel);

        this.updateFromChatOnRoom(res);

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

        this.updateMemberType(memberStruct.UserId, memberStruct.OpenChatMemberType);
    }

    updateMemberType(userId: Long, memberType: OpenMemberType) {
        if (!this.hasUserInfo(userId)) return;

        this.memberTypeMap.set(userId.toString(), memberType);
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

        let openLinkInfo = await this.Channel.Client.OpenChatManager.get(this.Channel.LinkId);

        this.updateRoomName(openLinkInfo.LinkName);
        
        this.linkInfo = openLinkInfo;
    }

    protected async updateFromChatOnRoom(res: PacketChatOnRoomRes) {
        super.updateFromChatOnRoom(res);
        
        if (res.ClientOpenProfile) {
            this.ClientUserInfo.updateFromOpenStruct(res.ClientOpenProfile);
            this.updateMemberType(this.ClientUserInfo.User.Id, res.ClientOpenProfile.MemberType);
        } else {
            let linkInfo = await this.Channel.Client.OpenChatManager.get(this.Channel.LinkId);

            if (linkInfo.Owner.UserId.equals(this.ClientUserInfo.User.Id)) this.ClientUserInfo.updateFromOpenStruct(linkInfo.Owner);
        }
    }
    
}