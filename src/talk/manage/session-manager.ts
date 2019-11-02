import { ChatChannel } from "../room/chat-channel";
import { ChatDataStruct } from "../struct/chatdata-struct";
import { ClientChatUser } from "../user/chat-user";
import { Long } from "bson";
import { TalkClient } from "../../talk-client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class SessionManager {

    private client: TalkClient;

    private clientUser: ClientChatUser;

    private channelMap: Map<string, ChatChannel>;

    constructor(client: TalkClient, clientUser: ClientChatUser) {
        this.client = client;
        this.clientUser = clientUser;

        this.channelMap = new Map();
    }

    get Client() {
        return this.client;
    }

    get ClientUser() {
        return this.clientUser;
    }
    
    get ChannelList() {
        return Array.from(this.channelMap.values());
    }

    hasChannel(id: Long): boolean {
        return this.channelMap.has(id.toString());
    }

    getChannelById(id: Long): ChatChannel {
        if (!this.hasChannel(id)) {
            throw new Error(`Invalid channel ${id}`)
        }

        return this.channelMap.get(id.toString())!;
    }

    addChannel(channel: ChatChannel) {
        if (this.hasChannel(channel.ChannelId)) {
            throw new Error(`Invalid channel. Channel already exists`);
        }
        this.client.emit('join_channel', channel);

        this.channelMap.set(channel.ChannelId.toString(), channel);
    }

    removeChannelLeft(id: Long) {
        let channel = this.getChannelById(id);

        this.channelMap.delete(id.toString());
        this.client.emit('left_channel', channel);

        return channel;
    }
    
    initSession(initDataList: ChatDataStruct[]) {
        this.channelMap.clear();

        for (let chatData of initDataList) {
            let chan = new ChatChannel(chatData.ChannelId, chatData.Type);

            this.addChannel(chan);
        }
    }

}