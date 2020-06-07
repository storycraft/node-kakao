/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncIdStore } from "../../store/store";
import { ChatChannel, OpenChatChannel } from "./chat-channel";
import { Long } from "bson";
import { LocoClient } from "../../client";
import { ChatUser } from "../user/chat-user";
import { PacketCreateChatRes, PacketCreateChatReq } from "../../packet/packet-create-chat";
import { PacketChatInfoReq, PacketChatInfoRes } from "../../packet/packet-chatinfo";
import { ChatInfoStruct } from "../struct/chat-info-struct";
import { ChatDataStruct } from "../struct/chatdata-struct";
import { PacketLeaveRes, PacketLeaveReq } from "../../packet/packet-leave";
import { ChannelType } from "../chat/channel-type";
import { StatusCode } from "../../packet/loco-packet-base";
import { PacketChatOnRoomReq, PacketChatOnRoomRes } from "../../packet/packet-chat-on-room";
import { PacketMessageNotiReadReq } from "../../packet/packet-noti-read";
import { PacketUpdateChannelRes, PacketUpdateChannelReq } from "../../packet/packet-update-channel";
import { PacketSetMetaReq, PacketSetMetaRes } from "../../packet/packet-set-meta";
import { ChannelMetaType, ChannelClientMetaType, ChannelMetaStruct, PrivilegeMetaContent, ProfileMetaContent, TvLiveMetaContent, TvMetaContent, LiveTalkCountMetaContent, GroupMetaContent } from "../struct/channel-meta-struct";
import { PacketSetClientMetaRes, PacketSetClientMetaReq } from "../../packet/packet-set-client-meta";
import { PacketGetMetaRes, PacketGetMetaReq, PacketGetMetaListReq, PacketGetMetaListRes } from "../../packet/packet-get-meta";
import { PacketGetClientMetaRes, PacketGetClientMetaReq } from "../../packet/packet-get-client-meta";

export class ChannelManager extends AsyncIdStore<ChatChannel> {
    
    constructor(private client: LocoClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    getChannelList() {
        return Array.from(super.values());
    }

    get(id: Long) {
        return super.get(id, true);
    }

    async createChannel(users: ChatUser[], nickname: string = '', profileURL: string = ''): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChatRes>(new PacketCreateChatReq(users.map((user) => user.Id), nickname, profileURL));

        if (this.has(res.ChannelId)) return this.get(res.ChannelId);

        let chan = this.channelFromChatData(res.ChannelId, res.ChatInfo!);

        this.setCache(res.ChannelId, chan);

        return chan;
    }

    protected async fetchValue(id: Long): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(id));

        return this.channelFromChatData(id, res.ChatInfo!);
    }

    protected channelFromChatData(id: Long, chatData: ChatDataStruct): ChatChannel {
        let channel: ChatChannel;

        switch(chatData.type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: channel = new OpenChatChannel(this.client, id, chatData.type, chatData.pushAlert, chatData.linkId!, chatData.openToken!); break;

            case ChannelType.GROUP:
            case ChannelType.PLUSCHAT:
            case ChannelType.DIRECT:
            case ChannelType.SELFCHAT: channel = new ChatChannel(this.client, id, chatData.type, chatData.pushAlert); break;


            default: channel = new ChatChannel(this.client, id, ChannelType.UNKNOWN, chatData.pushAlert); break;
            
        }

        return channel;
    }

    async requestChannelInfo(channelId: Long): Promise<ChatInfoStruct> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(channelId));

        if (res.StatusCode === StatusCode.SUCCESS || res.StatusCode === StatusCode.PARTIAL) {
            return res.ChatInfo!;
        } else {
            throw new Error('Received wrong info packet');
        }
    }

    async requestChatOnRoom(channel: ChatChannel): Promise<PacketChatOnRoomRes> {
        let packet = new PacketChatOnRoomReq(channel.Id, channel.LastChat ? channel.LastChat.LogId : Long.ZERO);

        if (channel.isOpenChat()) {
            packet.OpenChatToken = (<OpenChatChannel> channel).OpenToken;
        }

        return await this.client.NetworkManager.requestPacketRes<PacketChatOnRoomRes>(packet);
    }

    async leave(channel: ChatChannel, block: boolean = false): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(channel.Id, block));

        return res.StatusCode !== StatusCode.SUCCESS;
    }

    async markRead(channel: ChatChannel, lastWatermark: Long): Promise<void> {
        if (channel.isOpenChat()) {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark, (channel as OpenChatChannel).LinkId));
        } else {
            await this.client.NetworkManager.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark));
        }
    }

    async updateChannelSettings(channel: ChatChannel, pushAlert: boolean): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateChannelRes>(new PacketUpdateChannelReq(channel.Id, pushAlert));

        if (res.StatusCode === StatusCode.SUCCESS) {
            channel.updateChannel(pushAlert);
            return true;
        }

        return false;
    }

    async requestChannelMeta(channel: ChatChannel, type: ChannelMetaType): Promise<ChannelMetaStruct | null> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMetaRes>(new PacketGetMetaReq(channel.Id, [ type ]));

        return res.MetaList[0] || null;
    }

    async requestChannelMetaList(channel: ChatChannel): Promise<ChannelMetaStruct[]> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMetaListRes>(new PacketGetMetaListReq([ channel.Id ]));

        return res.MetaSetList[0] && res.MetaSetList[0].metaList || null;
    }

    async updateChannelMeta(channel: ChatChannel, type: ChannelMetaType, content: string): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMetaRes>(new PacketSetMetaReq(channel.Id, type, content));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async updateChannelClientMeta(channel: ChatChannel, type: ChannelClientMetaType, content: string): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetClientMetaRes>(new PacketSetClientMetaReq(channel.Id, type, content));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async setTitleMeta(channel: ChatChannel, title: string): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.TITLE, title);
    }

    async setNoticeMeta(channel: ChatChannel, notice: string): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.NOTICE, notice);
    }

    async setPrivilegeMeta(channel: ChatChannel, content: PrivilegeMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.PRIVILEGE, JSON.stringify(content));
    }

    async setProfileMeta(channel: ChatChannel, content: ProfileMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.PROFILE, JSON.stringify(content));
    }

    async setTvMeta(channel: ChatChannel, content: TvMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV, JSON.stringify(content));
    }

    async setTvLiveMeta(channel: ChatChannel, content: TvLiveMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.TV_LIVE, JSON.stringify(content));
    }

    async setLiveTalkCountMeta(channel: ChatChannel, content: LiveTalkCountMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.LIVE_TALK_COUNT, JSON.stringify(content));
    }

    async setGroupMeta(channel: ChatChannel, content: GroupMetaContent): Promise<boolean> {
        return this.updateChannelMeta(channel, ChannelMetaType.GROUP, JSON.stringify(content));
    }

    removeChannel(channel: ChatChannel) {
        let id = channel.Id;

        if (!this.has(id)) return false;

        this.delete(id);

        return true;
    }

    initalizeLoginData(chatDataList: ChatDataStruct[]) {
        this.clear();
        
        for (let chatData of chatDataList) {
            let channel: ChatChannel = this.channelFromChatData(chatData.channelId, chatData);

            this.setCache(channel.Id, channel);
        }
    }

}