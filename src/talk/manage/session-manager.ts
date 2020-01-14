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
            return this.addChannel(id);
        }

        return this.channelMap.get(id.toString())!;
    }

    getUserFrom(chatChannel: ChatChannel, id: Long): ChatUser {
        return chatChannel.ChannelInfo.getUser(id);
    }

    addChannel(id: Long, chatroomType?: ChatroomType): ChatChannel {
        let channel = this.addChannelInternal(id, chatroomType);

        this.client.emit('join_channel', channel);

        return channel;
    }

    protected addChannelInternal(id: Long, chatroomType?: ChatroomType): ChatChannel {
        if (this.hasChannel(id)) {
            throw new Error(`Invalid channel. Channel already exists`);
        }

        let channel = new ChatChannel(this.Client, id, chatroomType);

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

        let chat: Chat;

        switch(chatLog.Type) {
            case MessageType.Text:
                chat = new TextChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.Photo:
                chat = new SinglePhotoChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.MultiPhoto:
                chat = new MultiPhotoChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.Video:
                chat = new VideoChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.Sticker:
                chat = new StaticEmoticonChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.StickerAni:
                chat = new AnimatedEmoticonChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            case MessageType.Search:
                chat = new SharpSearchChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;

            default:
                chat = new TextChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
                break;
        }

        return chat;
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
            let channel = this.addChannelInternal(chatData.ChannelId, chatData.Type);
        }

        this.ClientUser.updateOpenChatProfile(await this.initOpenChatProfile());
    }

}