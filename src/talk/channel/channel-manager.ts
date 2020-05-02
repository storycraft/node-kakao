/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { IdStore } from "../../store/store";
import { ChatChannel, OpenChatChannel } from "./chat-channel";
import { Long } from "bson";
import { TalkClient } from "../../talk-client";
import { ChatUser } from "../user/chat-user";
import { PacketCreateChatRes, PacketCreateChatReq } from "../../packet/packet-create-chat";
import { PacketChatInfoReq, PacketChatInfoRes } from "../../packet/packet-chatinfo";
import { ChatInfoStruct } from "../struct/chat-info-struct";
import { ChatDataStruct } from "../struct/chatdata-struct";
import { PacketLeaveRes, PacketLeaveReq } from "../../packet/packet-leave";
import { ChannelType } from "../chat/channel-type";
import { StatusCode } from "../../packet/loco-packet-base";

export class ChannelManager extends IdStore<ChatChannel> {
    
    constructor(private client: TalkClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    get(id: Long) {
        return super.get(id, true);
    }

    async createChannel(...users: ChatUser[]): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChatRes>(new PacketCreateChatReq(users.map((user) => user.Id)));

        if (this.has(res.ChannelId)) return this.get(res.ChannelId);

        let chan = this.channelFromChatInfo(res.ChatInfo);

        this.setCache(res.ChannelId, chan);

        return chan;
    }

    protected async fetchValue(key: Long): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(key));

        return this.channelFromChatInfo(res.ChatInfo);
    }

    protected channelFromChatInfo(chatInfo: ChatInfoStruct): ChatChannel {
        let channel: ChatChannel;

        switch(chatInfo.Type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: channel = new OpenChatChannel(this.client, chatInfo.ChannelId, chatInfo.Type, chatInfo.OpenLinkId, chatInfo.OpenChatToken); break;

            default: channel = new ChatChannel(this.client, chatInfo.ChannelId, chatInfo.Type); break;
            
        }

        return channel;
    }

    async leave(channel: ChatChannel, block: boolean = false): Promise<boolean> {
        let id = channel.Id;
        let res = await this.client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(id, block));

        if (res.StatusCode !== StatusCode.SUCCESS) return false;

        return this.syncLeft(channel);
    }

    syncLeft(channel: ChatChannel) {
        let id = channel.Id;

        if (!this.has(id)) return false;

        this.client.emit('left_channel', channel);

        this.delete(id);

        return true;
    }

    initalizeLoginData(chatDataList: ChatDataStruct[]) {
        for (let chatData of chatDataList) {
            
        }
    }

}