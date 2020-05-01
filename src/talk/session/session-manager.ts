import { ChatChannel } from "../room/chat-channel";
import { ChatDataStruct } from "../struct/chatdata-struct";
import { ClientChatUser, ChatUser } from "../user/chat-user";
import { Long } from "bson";
import { TalkClient } from "../../talk-client";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { Chat, TextChat, SinglePhotoChat, MultiPhotoChat, AnimatedEmoticonChat, StaticEmoticonChat, VideoChat, SharpSearchChat } from "../chat/chat";
import { MessageType } from "../chat/message-type";
import { ChatroomType } from "../chat/chatroom-type";
import { PacketSyncLinkReq, PacketSyncLinkRes } from "../../packet/packet-sync-link";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { PacketCreateChatReq, PacketCreateChatRes } from "../../packet/packet-create-chat";
import { ChatDeserializeMap } from "../chat/chat-deserialize-map";
import { OpenChatManager } from "../open/open-chat-manager";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class SessionManager {

    private client: TalkClient;

    private clientUser: ClientChatUser;

    private channelMap: Map<string, ChatChannel>;
    private userMap: Map<string, ChatUser>;

    private messageId: number;

    private openChatManager: OpenChatManager;

    constructor(client: TalkClient, clientUser: ClientChatUser) {
        this.client = client;
        this.clientUser = clientUser;

        this.messageId = 0;

        this.openChatManager = new OpenChatManager(this);

        this.channelMap = new Map();
        this.userMap = new Map();
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

    get OpenChatManager() {
        return this.openChatManager;
    }

    hasChannel(id: Long): boolean {
        return this.channelMap.has(id.toString());
    }

    getChannelById(id: Long): ChatChannel {
        if (!this.hasChannel(id)) {
            throw new Error(`Invalid channel ${id}`);
        }

        return this.channelMap.get(id.toString())!;
    }

    getUser(id: Long): ChatUser {
        if (this.clientUser.UserId.equals(id)) return this.clientUser;
        
        if (this.hasUser(id)) return this.userMap.get(id.toString())!;

        let user = new ChatUser(id);

        this.userMap.get(id.toString());

        return user;
    }

    hasUser(id: Long) {
        return this.userMap.has(id.toString()) || this.clientUser.UserId.equals(id);
    }

    async getUserFrom(chatChannel: ChatChannel, id: Long): Promise<ChatUser | null> {
        return (await chatChannel.getChannelInfo()).getUser(id);
    }

    async createChannel(...users: ChatUser[]): Promise<ChatChannel> {
        let res = await this.Client.NetworkManager.requestPacketRes<PacketCreateChatRes>(new PacketCreateChatReq(users.map((user) => user.UserId)));

        if (this.hasChannel(res.ChannelId)) return this.getChannelById(res.ChannelId);

        let chan = this.addChannel(res.ChannelId);

        return chan;
    }

    addChannel(id: Long): ChatChannel {
        let channel = this.addChannelInternal(id);

        this.client.emit('join_channel', channel);

        return channel;
    }

    protected addChannelInternal(id: Long): ChatChannel {
        if (this.hasChannel(id)) {
            throw new Error(`Invalid channel. Channel already exists`);
        }

        let channel = new ChatChannel(this, id);

        this.channelMap.set(id.toString(), channel);

        return channel;
    }

    removeChannelLeft(id: Long): ChatChannel {
        let channel = this.removeChannelLeftInternal(id);

        this.client.emit('left_channel', channel);

        return channel;
    }

    protected removeChannelLeftInternal(id: Long): ChatChannel {
        let channel = this.getChannelById(id);

        this.channelMap.delete(id.toString());

        return channel;
    }

    chatFromChatlog(chatLog: ChatlogStruct) {
        let channel = this.getChannelById(chatLog.ChannelId);
        let sender = this.getUser(chatLog.SenderId);

        const TypedChat = ChatDeserializeMap.getChatConstructor(chatLog.Type);
        return new TypedChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
    }

    // Count sent message count?!
    getNextMessageId(): number {
        return this.messageId++;
    }

    async syncOpenChatProfile(): Promise<OpenLinkStruct[]> {
        let openChatToken = this.ClientUser.OpenChatToken;

        let res = await this.Client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        if (res.OpenChatToken > openChatToken) {
            this.ClientUser.OpenChatToken = res.OpenChatToken;
        }

        return res.LinkList;
    }
    
    async initSession(initDataList: ChatDataStruct[], openChatToken: number) {
        this.channelMap.clear();

        this.ClientUser.OpenChatToken = openChatToken;

        for (let chatData of initDataList) {
            let channel = this.addChannelInternal(chatData.ChannelId);
        }
    }

}