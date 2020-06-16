/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncIdStore } from "../../store/store";
import { ChatChannel, OpenChatChannel, MemoChatChannel } from "./chat-channel";
import { Long } from "bson";
import { LocoClient } from "../../client";
import { ChatUser } from "../user/chat-user";
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
import { ChannelMetaType, ChannelClientMetaType, ChannelMetaStruct, PrivilegeMetaContent, ProfileMetaContent, TvLiveMetaContent, TvMetaContent, LiveTalkCountMetaContent, GroupMetaContent } from "../struct/channel-meta-struct";
import { PacketSetClientMetaRes, PacketSetClientMetaReq } from "../../packet/packet-set-client-meta";
import { PacketGetMetaRes, PacketGetMetaReq, PacketGetMetaListReq, PacketGetMetaListRes } from "../../packet/packet-get-meta";
import { ChannelSettings } from "./channel-settings";
import { PacketJoinLinkReq, PacketJoinLinkRes } from "../../packet/packet-join-link";
import { OpenProfileType, OpenLinkType, OpenMemberType } from "../open/open-link-type";
import { OpenLinkTemplate } from "../open/open-link-template";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "../../packet/packet-create-open-link";
import { OpenLinkChannel } from "../open/open-link";
import { MemberStruct } from "../struct/member-struct";
import { OpenMemberStruct } from "../struct/open/open-link-struct";
import { ManagedChatChannel, ManagedOpenChatChannel, ManagedBaseChatChannel, ManagedMemoChatChannel } from "../managed/managed-chat-channel";
import { PromiseTicket } from "../../ticket/promise-ticket";
import { RequestResult } from "../request/request-result";

export class ChannelManager extends AsyncIdStore<ChatChannel> {

    static readonly INFO_UPDATE_INTERVAL: number = 300000;

    private updateLockMap: WeakMap<ChatChannel, PromiseTicket<void>>;

    private channelInfoUpdateMap: WeakMap<ChatChannel, number>;
    private userInfoListUpdateMap: WeakMap<ChatChannel, number>;
    
    constructor(private client: LocoClient) {
        super();

        this.updateLockMap = new WeakMap();
        this.channelInfoUpdateMap = new WeakMap();
        this.userInfoListUpdateMap = new WeakMap();
    }

    get Client() {
        return this.client;
    }

    getChannelIdList() {
        return Array.from(super.values()).map((channel) => channel.Id);
    }

    getLastUserInfoUpdate(channel: ChatChannel): number {
        return this.userInfoListUpdateMap.get(channel) || 0;
    }

    getLastChannelInfoUpdate(channel: ChatChannel): number {
        return this.channelInfoUpdateMap.get(channel) || 0;
    }

    async get(id: Long, skipUpdate: boolean = false): Promise<ChatChannel> {
        let channel = await super.get(id) as ManagedBaseChatChannel;

        if (!skipUpdate) {
            if (this.updateLockMap.has(channel)) await this.updateLockMap.get(channel)!.createTicket();

            await this.updateChannel(channel);
        }

        return channel;
    }

    findOpenChatChannel(linkId: Long): OpenChatChannel | null {
        let channels = this.values();

        for(let channel of channels) {
            if (!channel.isOpenChat()) break;

            if (linkId.equals((channel as OpenChatChannel).LinkId)) return channel as OpenChatChannel;
        }

        return null;
    }

    protected async getWithChannelData(id: Long, channelData: ChannelDataStruct, cache: boolean = true): Promise<ManagedBaseChatChannel> {
        
        let channel: ManagedBaseChatChannel;
        switch(channelData.type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: {
                let openToken;
                if (channelData.openToken) openToken = channelData.openToken;
                let chatOnRoom = await this.requestChatOnRoom(id, Long.ZERO, openToken);

                let link = (await this.client.OpenLinkManager.get(channelData.linkId!)) as OpenLinkChannel;
                channel = new ManagedOpenChatChannel(this, id, channelData, channelData.linkId!, channelData.openToken!, link, chatOnRoom.ClientOpenProfile!);

                this.updateFromUserInfoList(channel, chatOnRoom.MemberList, chatOnRoom.ClientOpenProfile);
                break;
            }

            case ChannelType.SELFCHAT: channel = new ManagedMemoChatChannel(this, id, channelData); break;
            
            case ChannelType.GROUP:
            case ChannelType.PLUSCHAT:
            case ChannelType.DIRECT:
            default: {
                channel = new ManagedChatChannel(this, id, channelData);
                break;
            }
            
        }

        if (cache) this.setCache(id, channel);
        
        return channel;
    }

    protected async getWithChannelInfo(id: Long, channelInfo: ChannelInfoStruct, cache: boolean = true): Promise<ManagedBaseChatChannel> {
        let channel = await this.getWithChannelData(id, channelInfo, cache);

        await this.updateFromChannelInfo(channel, channelInfo);
        
        return channel;
    }

    protected async updateFromChannelInfo(channel: ManagedBaseChatChannel, channelInfo: ChannelInfoStruct) {
        channel.updateData(channelInfo);
        if (channelInfo.metadata) channel.updateClientMeta(channelInfo.metadata);
        if (channelInfo.channelMetaList) channel.updateMetaList(channelInfo.channelMetaList);
        if (channelInfo.lastChatLog) channel.updateLastChat(await this.client.ChatManager.chatFromChatlog(channelInfo.lastChatLog));

        this.channelInfoUpdateMap.set(channel, Date.now());
    }

    protected updateFromUserInfoList(channel: ManagedBaseChatChannel, memberList: (MemberStruct | OpenMemberStruct)[], openProfile?: OpenMemberStruct) {
        this.userInfoListUpdateMap.set(channel, Date.now());

        if (channel.Type=== ChannelType.SELFCHAT) return;
        
        if (!channel.isOpenChat()) {
            let normal = channel as ManagedChatChannel;

            normal.updateMemberList(memberList as MemberStruct[]);
        } else {
            let open = channel as ManagedOpenChatChannel;

            if (openProfile) open.updateClientUserInfo(openProfile);

            open.updateMemberList(memberList as OpenMemberStruct[]);
        }
    }

    protected async updateChannelInfo(channel: ManagedBaseChatChannel) {
        let channelInfo = await this.requestChannelInfo(channel.Id);

        await this.updateFromChannelInfo(channel, channelInfo);
    }

    protected async updateUserInfoList(channel: ManagedBaseChatChannel) {
        let openToken;
        if (channel.isOpenChat()) openToken = (channel as ManagedOpenChatChannel).OpenToken;
        let chatOnRoom = await this.requestChatOnRoom(channel.Id, channel.LastChat && channel.LastChat.LogId || Long.ZERO, openToken);

        this.updateFromUserInfoList(channel, chatOnRoom.MemberList, chatOnRoom.ClientOpenProfile);

        this.channelInfoUpdateMap.set(channel, Date.now());
    }
    
    protected async updateChannel(channel: ManagedBaseChatChannel) {
        let taskList: Promise<unknown>[] = [];

        let now = Date.now();

        if (this.getLastChannelInfoUpdate(channel) + ChannelManager.INFO_UPDATE_INTERVAL < now) taskList.push(this.updateChannelInfo(channel));

        if (this.getLastUserInfoUpdate(channel) + ChannelManager.INFO_UPDATE_INTERVAL < now) taskList.push(this.updateUserInfoList(channel));

        if (taskList.length > 0) {
            let ticketObj = new PromiseTicket<void>();
            
            this.updateLockMap.set(channel, ticketObj);
            let req = Promise.all(taskList);
    
            await req;
    
            ticketObj.resolve();
    
            this.updateLockMap.delete(channel);
        }
    }

    async createMemoChannel(): Promise<RequestResult<MemoChatChannel>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChannelRes>(new PacketCreateChannelReq([], '', '', true));

        if (this.has(res.ChannelId)) return { status: StatusCode.SUCCESS, result: await this.get(res.ChannelId) };

        if (!res.ChatInfo) return { status: res.StatusCode };

        let channel = await this.getWithChannelInfo(res.ChannelId, res.ChatInfo);
        
        return { status: res.StatusCode, result: channel };
    }

    async createChannel(users: ChatUser[], nickname: string = '', profileURL: string = ''): Promise<RequestResult<ChatChannel>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChannelRes>(new PacketCreateChannelReq(users.map((user) => user.Id), nickname, profileURL));

        if (this.has(res.ChannelId)) return { status: StatusCode.SUCCESS, result: await this.get(res.ChannelId) };

        if (!res.ChatInfo) return { status: res.StatusCode };

        let channel = await this.getWithChannelInfo(res.ChannelId, res.ChatInfo);
        
        return { status: res.StatusCode, result: channel };
    }

    async createOpenChannel(template: OpenLinkTemplate, profileType: OpenProfileType.MAIN): Promise<RequestResult<OpenChatChannel>>;
    async createOpenChannel(template: OpenLinkTemplate, profileType: OpenProfileType.KAKAO_ANON, nickname: string, profilePath: string): Promise<RequestResult<OpenChatChannel>>;
    async createOpenChannel(template: OpenLinkTemplate, profileType: OpenProfileType.OPEN_PROFILE, profileLinkId: Long): Promise<RequestResult<OpenChatChannel>>;
    async createOpenChannel(template: OpenLinkTemplate, profileType: OpenProfileType): Promise<RequestResult<OpenChatChannel>> {
        let packet = new PacketCreateOpenLinkReq(
            template.linkName, template.linkCoverPath, OpenLinkType.CHANNEL, template.description,
            template.limitProfileType, template.canSearchLink, 1, true, 0, 
            profileType, '', '', Long.ZERO,
            template.maxUserLimit);

        if (profileType === OpenProfileType.KAKAO_ANON) {
            packet.Nickname = arguments[2];
            packet.ProfilePath = arguments[3];
        } else if (profileType === OpenProfileType.OPEN_PROFILE) {
            packet.ProfileLinkId = arguments[2];
        }

        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateOpenLinkRes>(packet);

        if (!res.ChatInfo) return { status: res.StatusCode };
        
        return { status: res.StatusCode, result: (await this.getWithChannelInfo(res.ChatInfo.channelId, res.ChatInfo)) as ManagedOpenChatChannel };
    }

    async joinOpenChannel(linkId: Long, profileType: OpenProfileType.MAIN, passcode?: string): Promise<RequestResult<OpenChatChannel>>;
    async joinOpenChannel(linkId: Long, profileType: OpenProfileType.KAKAO_ANON, passcode: string, nickname: string, profilePath: string): Promise<RequestResult<OpenChatChannel>>;
    async joinOpenChannel(linkId: Long, profileType: OpenProfileType.OPEN_PROFILE, passcode: string, profileLinkId: Long): Promise<RequestResult<OpenChatChannel>>;
    async joinOpenChannel(linkId: Long, profileType: OpenProfileType, passcode: string = ''): Promise<RequestResult<OpenChatChannel>> {
        let packet = new PacketJoinLinkReq(linkId, 'EW:', passcode, profileType);
        if (profileType === OpenProfileType.KAKAO_ANON) {
            packet.Nickname = arguments[3];
            packet.ProfilePath = arguments[4];
        } else if (profileType === OpenProfileType.OPEN_PROFILE) {
            packet.ProfileLinkId = arguments[3];
        }

        let res = await this.client.NetworkManager.requestPacketRes<PacketJoinLinkRes>(packet);

        if (!res.ChatInfo) return { status: res.StatusCode };
        
        return { status: res.StatusCode, result: await this.getWithChannelInfo(res.ChatInfo.channelId, res.ChatInfo) as ManagedOpenChatChannel };
    }

    protected async fetchValue(id: Long) {
        let info = await this.requestChannelInfo(id);

        let channel = await this.getWithChannelInfo(id, info, false);

        return channel;
    }

    protected async requestChannelInfo(channelId: Long): Promise<ChannelInfoStruct> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChannelInfoRes>(new PacketChannelInfoReq(channelId));

        if (res.StatusCode === StatusCode.SUCCESS || res.StatusCode === StatusCode.PARTIAL) {
            return res.ChatInfo!;
        } else {
            throw new Error(`Cannot request ChannelInfo: ${res.StatusCode}`);
        }
    }

    protected async requestChatOnRoom(channelId: Long, lastChatLogId: Long, openToken?: number): Promise<PacketChatOnRoomRes> {
        let packet = new PacketChatOnRoomReq(channelId, lastChatLogId);

        if (openToken) packet.OpenToken = openToken;

        return await this.client.NetworkManager.requestPacketRes<PacketChatOnRoomRes>(packet);
    }

    async leave(channel: ChatChannel, block: boolean = false): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(channel.Id, block));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async markRead(channel: ChatChannel, lastWatermark: Long): Promise<void> {
        if (channel.isOpenChat()) {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark, (channel as OpenChatChannel).LinkId));
        } else {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark));
        }
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
        return this.updateChannelMeta(channel, ChannelMetaType.PRIVILEGE, JSON.stringify(content));
    }

    async setProfileMeta(channel: ChatChannel, content: ProfileMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.PROFILE, JSON.stringify(content));
    }

    async setTvMeta(channel: ChatChannel, content: TvMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV, JSON.stringify(content));
    }

    async setTvLiveMeta(channel: ChatChannel, content: TvLiveMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV_LIVE, JSON.stringify(content));
    }

    async setLiveTalkCountMeta(channel: ChatChannel, content: LiveTalkCountMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.LIVE_TALK_COUNT, JSON.stringify(content));
    }

    async setGroupMeta(channel: ChatChannel, content: GroupMetaContent): Promise<RequestResult<boolean>> {
        return this.updateChannelMeta(channel, ChannelMetaType.GROUP, JSON.stringify(content));
    }

    removeChannel(channel: ChatChannel) {
        let id = channel.Id;

        if (!this.has(id)) return false;

        this.delete(id);

        return true;
    }

    async initalizeLoginData(chatDataList: ChannelDataStruct[]) {
        this.clear();

        return Promise.all(chatDataList.map((chatData) => this.getWithChannelData(chatData.channelId, chatData)));
    }

}
