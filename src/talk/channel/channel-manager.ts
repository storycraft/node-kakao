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
        let res = await this.client.LocoInterface.requestPacketRes<PacketCreateChatRes>(new PacketCreateChatReq(users.map((user) => user.Id), nickname, profileURL));

        if (this.has(res.ChannelId)) return this.get(res.ChannelId);

        let chan = this.channelFromChatData(res.ChannelId, res.ChatInfo!);

        this.setCache(res.ChannelId, chan);

        return chan;
    }

    protected async fetchValue(id: Long): Promise<ChatChannel> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(id));

        return this.channelFromChatData(id, res.ChatInfo!);
    }

    protected channelFromChatData(id: Long, chatData: ChatDataStruct): ChatChannel {
        let channel: ChatChannel;

        switch(chatData.type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: channel = new OpenChatChannel(this.client, id, chatData.type, chatData.linkId!, chatData.openToken!); break;

            case ChannelType.GROUP:
            case ChannelType.PLUSCHAT:
            case ChannelType.DIRECT:
            case ChannelType.SELFCHAT: channel = new ChatChannel(this.client, id, chatData.type); break;


            default: channel = new ChatChannel(this.client, id, ChannelType.UNKNOWN); break;
            
        }

        return channel;
    }

    async requestChannelInfo(channelId: Long): Promise<ChatInfoStruct> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(channelId));

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

        return await this.client.LocoInterface.requestPacketRes<PacketChatOnRoomRes>(packet);
    }

    async leave(channel: ChatChannel, block: boolean = false): Promise<boolean> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(channel.Id, block));

        return res.StatusCode !== StatusCode.SUCCESS;
    }

    async markRead(channel: ChatChannel, lastWatermark: Long): Promise<void> {
        if (channel.isOpenChat()) {
            await this.Client.LocoInterface.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark, (channel as OpenChatChannel).LinkId));
        } else {
            await this.Client.LocoInterface.sendPacket(new PacketMessageNotiReadReq(channel.Id, lastWatermark));
        }
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