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
            throw new Error(`Invalid channel ${id}`);
        }

        return this.channelMap.get(id.toString())!;
    }

    getUserFrom(chatChannel: ChatChannel, id: Long): ChatUser {
        return chatChannel.ChannelInfo.getUser(id);
    }

    async createChannel(...users: ChatUser[]): Promise<ChatChannel> {
        return await new Promise<ChatChannel>((resolve, reject) => this.Client.NetworkManager.sendPacket(new PacketCreateChatReq(users.map((user) => user.UserId)).once('response', (res: PacketCreateChatRes) => {
            if (this.hasChannel(res.ChannelId)) resolve(this.getChannelById(res.ChannelId));

            let chan = this.addChannel(res.ChannelId, res.ChatInfo.Type);
            chan.ChannelInfo.update(res.ChatInfo);

            resolve();
        })));
    }

    addChannel(id: Long, chatroomType?: ChatroomType, openLinkId?: Long): ChatChannel {
        let channel = this.addChannelInternal(id, chatroomType, openLinkId);

        this.client.emit('join_channel', channel);

        return channel;
    }

    protected addChannelInternal(id: Long, chatroomType?: ChatroomType, openLinkId?: Long): ChatChannel {
        if (this.hasChannel(id)) {
            throw new Error(`Invalid channel. Channel already exists`);
        }

        let channel = new ChatChannel(this.Client, id, chatroomType, openLinkId);

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
        let sender = this.getUserFrom(channel, chatLog.SenderId);

        const TypedChat = ChatDeserializeMap.getChatConstructor(chatLog.Type);
        return new TypedChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
    }

    async initOpenChatProfile(): Promise<OpenLinkStruct[]> {
        let openChatToken = this.ClientUser.OpenChatToken;

        return await new Promise<OpenLinkStruct[]>((resolve, reject) => this.Client.NetworkManager.sendPacket(new PacketSyncLinkReq(openChatToken).once('response', (res: PacketSyncLinkRes) => {

            if (res.OpenChatToken > openChatToken) {
                this.ClientUser.OpenChatToken = res.OpenChatToken;
            }

            resolve(res.LinkList);
        })));
    }
    
    async initSession(initDataList: ChatDataStruct[], openChatToken: number) {
        this.channelMap.clear();

        this.ClientUser.OpenChatToken = openChatToken;

        for (let chatData of initDataList) {
            let channel = this.addChannelInternal(chatData.ChannelId, chatData.Type, chatData.OpenLinkId !== Long.ZERO ? chatData.OpenLinkId : undefined);
        }

        this.ClientUser.updateOpenChatProfile(await this.initOpenChatProfile());
    }

}