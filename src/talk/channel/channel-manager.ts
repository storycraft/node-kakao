/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { IdStore } from "../../store/store";
import { ChatChannel, OpenChatChannel, MemoChatChannel, NormalChatChannel } from "./chat-channel";
import { Long } from "bson";
import { LocoClient } from "../../client";
import { ChatUser, DisplayUserInfo } from "../user/chat-user";
import { PacketCreateChannelRes, PacketCreateChannelReq } from "../../packet/packet-create-channel";
import { PacketChannelInfoReq, PacketChannelInfoRes } from "../../packet/packet-channel-info";
import { ChannelInfoStruct } from "../struct/channel-info-struct";
import { ChannelDataStruct } from "../struct/channel-data-struct";
import { PacketLeaveRes, PacketLeaveReq } from "../../packet/packet-leave";
import { ChannelType } from "./channel-type";
import { StatusCode } from "../../packet/loco-packet-base";
import { PacketChatOnRoomReq, PacketChatOnRoomRes } from "../../packet/packet-chat-on-room";
import { PacketMessageNotiReadReq } from "../../packet/packet-noti-read";
import { PacketUpdateChannelRes, PacketUpdateChannelReq } from "../../packet/packet-update-channel";
import { PacketSetMetaReq, PacketSetMetaRes } from "../../packet/packet-set-meta";
import { ChannelMetaType, ChannelClientMetaType, ChannelMetaStruct, PrivilegeMetaContent, ProfileMetaContent, TvLiveMetaContent, TvMetaContent, LiveTalkCountMetaContent, GroupMetaContent, BotMetaContent } from "../struct/channel-meta-struct";
import { PacketSetClientMetaRes, PacketSetClientMetaReq } from "../../packet/packet-set-client-meta";
import { PacketGetMetaRes, PacketGetMetaReq, PacketGetMetaListReq, PacketGetMetaListRes } from "../../packet/packet-get-meta";
import { ChannelSettings } from "./channel-settings";
import { PacketJoinLinkReq, PacketJoinLinkRes } from "../../packet/packet-join-link";
import { OpenProfileType, OpenLinkType } from "../open/open-link-type";
import { OpenLinkTemplate } from "../open/open-link-template";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "../../packet/packet-create-open-link";
import { OpenLinkChannel } from "../open/open-link";
import { MemberStruct, DisplayMemberStruct } from "../struct/member-struct";
import { OpenMemberStruct } from "../struct/open/open-link-struct";
import { ManagedChatChannel, ManagedOpenChatChannel, ManagedMemoChatChannel, ManagedDisplayUserInfo, ManagedNormalChatChannel } from "../managed/managed-chat-channel";
import { RequestResult } from "../request/request-result";
import { OpenProfileTemplates } from "../open/open-link-profile-template";
import { PacketAddMemberReq, PacketAddMemberRes } from "../../packet/packet-add-member";
import { PacketKickLeaveReq, PacketKickLeaveRes } from "../../packet/packet-kick-leave";
import { JsonUtil } from "../../util/json-util";
import { PacketCheckJoinReq, PacketCheckJoinRes } from "../../packet/packet-check-join";

export class ChannelManager extends IdStore<ChatChannel> {

    static readonly INFO_UPDATE_INTERVAL: number = 300000;
    
    constructor(private client: LocoClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    getChannelList(): ChatChannel[] {
        return Array.from(super.values());
    }

    findOpenChatChannel(linkId: Long): OpenChatChannel | null {
        let channels = this.values();

        for(let channel of channels) {
            if (!channel.isOpenChat()) break;

            if (linkId.equals((channel as OpenChatChannel).LinkId)) return channel as OpenChatChannel;
        }

        return null;
    }

    protected async addWithChannelData(id: Long, channelData: ChannelDataStruct): Promise<ManagedChatChannel> {
        let channel: ManagedChatChannel;
        switch(channelData.type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: {
                let link = await this.client.OpenLinkManager.get(channelData.linkId!) as OpenLinkChannel | null;

                if (!link) throw new Error(`Invalid OpenLink at Channel ${id}`);

                channel = new ManagedOpenChatChannel(this, id, channelData, channelData.linkId!, channelData.openToken!, link);
                break;
            }

            case ChannelType.SELFCHAT: channel = new ManagedMemoChatChannel(this, id, channelData); break;
            
            case ChannelType.GROUP:
            case ChannelType.DIRECT: channel = new ManagedNormalChatChannel(this, id, channelData); break;

            case ChannelType.PLUSCHAT:
            default: channel = new ManagedChatChannel(this, id, channelData); break;
            
        }

        await this.sendChatOn(channel);
        this.set(id, channel);
        
        return channel;
    }

    async addChannel(id: Long): Promise<ManagedChatChannel | null> {
        let info = await this.requestChannelInfo(id);

        if (!info) return null;

        return this.addWithChannelInfo(id, info);
    }

    async addWithChannelInfo(id: Long, channelInfo: ChannelInfoStruct): Promise<ManagedChatChannel> {
        let channel = await this.addWithChannelData(id, channelInfo);

        this.initChannelInfo(channel, channelInfo);
        
        return channel;
    }

    protected initChannelInfo(channel: ManagedChatChannel, channelInfo: ChannelInfoStruct) {
        channel.updateData(channelInfo);
        
        if (channelInfo.metadata) channel.updateClientMeta(channelInfo.metadata);
        if (channelInfo.channelMetaList) channel.updateMetaList(channelInfo.channelMetaList);
        if (channelInfo.lastChatLog) channel.updateLastChat(this.client.ChatManager.chatFromChatlog(channelInfo.lastChatLog)!);
        if (channelInfo.displayMemberList) channel.updateDisplayUserInfoList(channelInfo.displayMemberList.map(this.getDisplayUserInfoFromStruct.bind(this)));
    }

    protected initUserInfoList(channel: ManagedChatChannel, memberList: (MemberStruct | OpenMemberStruct)[], openProfile?: OpenMemberStruct) {
        if (!channel.isOpenChat()) {
            let normal = channel as ManagedChatChannel;

            normal.updateMemberList(memberList as MemberStruct[]);
        } else {
            let open = channel as ManagedOpenChatChannel;

            if (openProfile) open.updateOpenMember(openProfile);

            open.updateOpenMemberList(memberList as OpenMemberStruct[]);
        }
    }

    protected getDisplayUserInfoFromStruct(memberStruct: DisplayMemberStruct): ManagedDisplayUserInfo {
        return new ManagedDisplayUserInfo(this.client.UserManager.get(memberStruct.userId), memberStruct);
    }

    async createMemoChannel(): Promise<RequestResult<MemoChatChannel>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChannelRes>(new PacketCreateChannelReq([], '', '', true));

        if (this.has(res.ChannelId)) return { status: StatusCode.SUCCESS, result: this.get(res.ChannelId) as MemoChatChannel };

        if (!res.ChatInfo) return { status: res.StatusCode };

        let channel = await this.addWithChannelInfo(res.ChannelId, res.ChatInfo);
        
        return { status: res.StatusCode, result: channel as ManagedMemoChatChannel };
    }

    async createChannel(users: ChatUser[], nickname: string = '', profileURL: string = ''): Promise<RequestResult<ChatChannel>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChannelRes>(new PacketCreateChannelReq(users.map((user) => user.Id), nickname, profileURL));

        if (this.has(res.ChannelId)) return { status: StatusCode.SUCCESS, result: this.get(res.ChannelId) };

        if (!res.ChatInfo) return { status: res.StatusCode };

        let channel = await this.addWithChannelInfo(res.ChannelId, res.ChatInfo);
        
        return { status: res.StatusCode, result: channel };
    }

    async createOpenChannel(template: OpenLinkTemplate): Promise<RequestResult<OpenChatChannel>> {
        let packet = new PacketCreateOpenLinkReq(
            template.linkName, template.linkCoverPath, OpenLinkType.CHANNEL, template.description, template.profileContent || null,
            template.allowAnonProfile, template.canSearchLink, Long.fromNumber(Date.now() / 1000), true, 0,
            template.clientProfile.type, template.clientProfile.anonNickname, template.clientProfile.anonProfilePath, template.clientProfile.profileLinkId,
            template.maxUserLimit);

        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateOpenLinkRes>(packet);

        if (!res.ChatInfo || !res.OpenLink) return { status: res.StatusCode };

        // fix linkid and openToken
        res.ChatInfo.linkId = res.OpenLink.linkId;
        res.ChatInfo.openToken = res.OpenLink.openToken;
        
        return { status: res.StatusCode, result: await this.addWithChannelInfo(res.ChatInfo.channelId, res.ChatInfo) as ManagedOpenChatChannel };
    }

    async joinOpenChannel(linkId: Long, profileTemplate: OpenProfileTemplates, passcode: string = ''): Promise<RequestResult<OpenChatChannel>> {
        let joinToken: string = '';

        if (passcode) {
            let checkPacket = new PacketCheckJoinReq(linkId, passcode);
            let checkRes = await this.client.NetworkManager.requestPacketRes<PacketCheckJoinRes>(checkPacket);

            if (checkRes.StatusCode !== StatusCode.SUCCESS) return { status: checkRes.StatusCode };

            joinToken = checkRes.Token;
        }

        let joinPacket = new PacketJoinLinkReq(linkId, 'EW:', joinToken, profileTemplate.type, profileTemplate.anonNickname, profileTemplate.anonProfilePath, profileTemplate.profileLinkId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketJoinLinkRes>(joinPacket);

        if (!res.ChatInfo || !res.LinkInfo) return { status: res.StatusCode };

        // fix linkid and openToken
        res.ChatInfo.linkId = res.LinkInfo.linkId;
        res.ChatInfo.openToken = res.LinkInfo.openToken;
        
        return { status: res.StatusCode, result: await this.addWithChannelInfo(res.ChatInfo.channelId, res.ChatInfo) as ManagedOpenChatChannel };
    }

    protected async requestChannelInfo(channelId: Long): Promise<ChannelInfoStruct | null> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChannelInfoRes>(new PacketChannelInfoReq(channelId));

        if (res.StatusCode === StatusCode.SUCCESS || res.StatusCode === StatusCode.INVALID_CHATROOM_OPERATION) {
            return res.ChatInfo!;
        } else {
            return null;
        }
    }

    async sendChatOn(channel: ChatChannel): Promise<RequestResult<boolean>> {
        let token = channel.LastChat ? channel.LastChat.LogId : Long.ZERO;
        let openToken;
        if (channel.isOpenChat()) openToken = (channel as OpenChatChannel).OpenToken;

        let res = await this.client.NetworkManager.requestPacketRes<PacketChatOnRoomRes>(new PacketChatOnRoomReq(channel.Id, token, openToken));
    
        this.initUserInfoList(channel as ManagedChatChannel, res.MemberList, res.ClientOpenProfile);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }
    
    async leave(channel: ChatChannel, block: boolean = false): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(channel.Id, block));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async leaveKicked(channel: OpenChatChannel): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketKickLeaveRes>(new PacketKickLeaveReq(channel.LinkId, channel.Id));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async markRead(channel: ChatChannel, lastWatermark: Long): Promise<void> {
        if (channel.isOpenChat()) {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark, (channel as OpenChatChannel).LinkId));
        } else {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark));
        }
    }

    async inviteUser(channel: NormalChatChannel, user: ChatUser) {
        return this.inviteUserId(channel, user.Id);
    }

    async inviteUserId(channel: NormalChatChannel, userId: Long) {
        return this.inviteUserIdList(channel, [ userId ]);
    }

    async inviteUserList(channel: NormalChatChannel, userList: ChatUser[]) {
        return this.inviteUserIdList(channel, userList.map(user => user.Id));
    }

    async inviteUserIdList(channel: NormalChatChannel, userIdList: Long[]): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketAddMemberRes>(new PacketAddMemberReq(channel.Id, userIdList));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async updateChannelSettings(channel: ChatChannel, settings: ChannelSettings): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateChannelRes>(new PacketUpdateChannelReq(channel.Id, settings.pushAlert));

        if (res.StatusCode === StatusCode.SUCCESS) (channel as ManagedChatChannel).updateChannelSettings(settings);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async requestChannelMeta(channel: ChatChannel, type: ChannelMetaType): Promise<RequestResult<ChannelMetaStruct>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMetaRes>(new PacketGetMetaReq(channel.Id, [ type ]));

        return { status: res.StatusCode, result: res.MetaList[0] };
    }

    async requestChannelMetaList(channel: ChatChannel): Promise<RequestResult<ChannelMetaStruct[]>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMetaListRes>(new PacketGetMetaListReq([ channel.Id ]));

        return { status: res.StatusCode, result: res.MetaSetList[0] && res.MetaSetList[0].metaList || null };
    }

    async updateChannelMeta(channel: ChatChannel, type: ChannelMetaType, content: string): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMetaRes>(new PacketSetMetaReq(channel.Id, type, content));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async updateChannelClientMeta(channel: ChatChannel, type: ChannelClientMetaType, content: string): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetClientMetaRes>(new PacketSetClientMetaReq(channel.Id, type, content));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async setTitleMeta(channel: ChatChannel, title: string): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.TITLE, title);
    }

    async setNoticeMeta(channel: ChatChannel, notice: string): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.NOTICE, notice);
    }

    async setPrivilegeMeta(channel: ChatChannel, content: PrivilegeMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.PRIVILEGE, JsonUtil.stringifyLoseless(content));
    }

    async setProfileMeta(channel: ChatChannel, content: ProfileMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.PROFILE, JsonUtil.stringifyLoseless(content));
    }

    async setTvMeta(channel: ChatChannel, content: TvMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV, JsonUtil.stringifyLoseless(content));
    }

    async setTvLiveMeta(channel: ChatChannel, content: TvLiveMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV_LIVE, JsonUtil.stringifyLoseless(content));
    }

    async setLiveTalkCountMeta(channel: ChatChannel, content: LiveTalkCountMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.LIVE_TALK_COUNT, JsonUtil.stringifyLoseless(content));
    }

    async setGroupMeta(channel: ChatChannel, content: GroupMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.GROUP, JsonUtil.stringifyLoseless(content));
    }

    async setBotMeta(channel: ChatChannel, content: BotMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.BOT, JsonUtil.stringifyLoseless(content));
    }

    removeChannel(channelId: Long) {
        if (!this.has(channelId)) return false;

        this.delete(channelId);

        return true;
    }

    protected async initWithChannelData(channelData: ChannelDataStruct): Promise<ManagedChatChannel> {
        let channel = await this.addWithChannelData(channelData.channelId, channelData);

        let info = await this.requestChannelInfo(channel.Id);

        if (info) this.initChannelInfo(channel, info);
        
        return channel;
    }
    
    async initializeLoginData(chatDataList: ChannelDataStruct[]) {
        this.clear();

        return Promise.all(chatDataList.map(this.initWithChannelData.bind(this)));
    }

}
