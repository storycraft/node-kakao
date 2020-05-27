/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoClient } from "../../client";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { Long } from "bson";
import { StatusCode } from "../../packet/loco-packet-base";
import { PacketDeleteChatRes, PacketDeleteChatReq } from "../../packet/packet-delete-chat";
import { Chat, TypeMap } from "./chat";
import { PacketSyncMessageReq, PacketSyncMessageRes } from "../../packet/packet-sync-message";
import { PacketMultiChatlogReq, PacketMultiChatlogRes } from "../../packet/packet-multi-chatlog";

export class ChatManager {
    
    private messageId: number;

    constructor(private client: LocoClient) {
        this.messageId = 0;
    }

    get Client() {
        return this.client;
    }

    get CurrentMessageId() {
        return this.messageId;
    }

    getNextMessageId() {
        return this.messageId++;
    }

    async getChatListFrom(channelId: Long, since: number): Promise<Chat[]> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketMultiChatlogRes>(new PacketMultiChatlogReq([ channelId ], [ since ]));

        if (res.StatusCode !== StatusCode.SUCCESS) return [];

        let taskList: Promise<Chat>[] = [];
        for (let chatLog of res.ChatlogList) {
            taskList.push(this.chatFromChatlog(chatLog));
        }

        return Promise.all(taskList);
    }

    async getChatListBetween(channelId: Long, startLogId: Long, count: number, endLogId: Long): Promise<Chat[]> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketSyncMessageRes>(new PacketSyncMessageReq(channelId, startLogId, count, endLogId));

        let taskList: Promise<Chat>[] = [];
        for (let chatLog of res.ChatList) {
            taskList.push(this.chatFromChatlog(chatLog));
        }

        return Promise.all(taskList);
    }

    async chatFromChatlog(chatLog: ChatlogStruct) {
        let channel = await this.Client.ChannelManager.get(chatLog.channelId);
        let sender = this.Client.UserManager.get(chatLog.senderId);

        const TypedChat = TypeMap.getChatConstructor(chatLog.type);

        return new TypedChat(channel, sender, chatLog.messageId, chatLog.logId, chatLog.prevLogId, chatLog.sendTime, chatLog.text, chatLog.rawAttachment);
    }

    async deleteChat(channelId: Long, logId: Long): Promise<boolean> {
        let res = await this.client.LocoInterface.requestPacketRes<PacketDeleteChatRes>(new PacketDeleteChatReq(channelId, logId));

        return res.StatusCode === StatusCode.SUCCESS;
    }
    
}