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
import { MediaManager } from "../media/media-manager";
import { ChatChannel } from "../channel/chat-channel";
import { ChatBuilder } from "./chat-builder";
import { JsonUtil } from "../../util/json-util";
import { ChatContent } from "./attachment/chat-attachment";
import { PacketMessageWriteReq, PacketMessageWriteRes } from "../../packet/packet-message";
import { ChatType } from "./chat-type";
import { MessageTemplate } from "./template/message-template";
import { RequestResult } from "../request/request-result";
import { MediaTemplates } from "./template/media-template";
import { StructType } from "../struct/struct-base";
import { PacketForwardReq, PacketForwardRes } from "../../packet/packet-forward";

export class ChatManager {

    private mediaManager: MediaManager;
    
    private messageId: number;

    constructor(private client: LocoClient) {
        this.messageId = 0;

        this.mediaManager = new MediaManager(client);
    }

    get Client() {
        return this.client;
    }

    get MediaManager() {
        return this.mediaManager;
    }

    get CurrentMessageId() {
        return this.messageId;
    }

    getNextMessageId() {
        return this.messageId++;
    }

    async getChatListFrom(channelId: Long, sinceLogId: Long): Promise<RequestResult<Chat[]>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketMultiChatlogRes>(new PacketMultiChatlogReq([ channelId ], [ sinceLogId ]));

        let chatList: Chat[] = [];
        for (let chatLog of res.ChatlogList) {
            let chat = this.chatFromChatlog(chatLog);

            if (chat) chatList.push(chat);
        }

        return { status: res.StatusCode, result: chatList };
    }

    async getChatListBetween(channelId: Long, startLogId: Long, count: number, endLogId: Long): Promise<RequestResult<Chat[]>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSyncMessageRes>(new PacketSyncMessageReq(channelId, startLogId, count, endLogId));

        let chatList: Chat[] = [];
        for (let chatLog of res.ChatList) {
            let chat = this.chatFromChatlog(chatLog);

            if (chat) chatList.push(chat);
        }

        return { status: res.StatusCode, result: chatList };
    }

    protected async chatFromWriteRes(res: PacketMessageWriteRes, text: string, extra: string): Promise<Chat | null> {
        if (res.Chatlog) return this.chatFromChatlog(res.Chatlog);

        return this.chatFromChatlog({
            logId: res.LogId,
            prevLogId: res.PrevLogId,
            senderId: this.client.ClientUser.Id,
            channelId: res.ChannelId,
            type: ChatType.Text,
            text: text,
            sendTime: res.SendTime,
            rawAttachment: extra,
            messageId: res.MessageId
        });
    }

    async sendText(channel: ChatChannel, ...textFormat: (string | ChatContent)[]): Promise<Chat | null> {
        let { text, extra } = ChatBuilder.buildMessage(...textFormat);

        return this.sendRaw(channel, ChatType.Text, text, extra);
    }

    async forwardChat(channel: ChatChannel, chat: Chat): Promise<Chat | null> {
        return this.forwardRaw(channel, chat.Type, chat.Text, chat.RawAttachment);
    }

    async sendRaw(channel: ChatChannel, type: ChatType, text: string, extra: { [ key: string ]: StructType }): Promise<Chat | null> {
        let extraText = JsonUtil.stringifyLoseless(extra);
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.client.ChatManager.getNextMessageId(), channel.Id, text, type, true, extraText));
        
        if (res.StatusCode !== StatusCode.SUCCESS) return null;

        return this.chatFromWriteRes(res, text, extraText);
    }

    async forwardRaw(channel: ChatChannel, type: ChatType, text: string, extra: { [ key: string ]: StructType }): Promise<Chat | null> {
        let extraText = JsonUtil.stringifyLoseless(extra);
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketForwardRes>(new PacketForwardReq(this.client.ChatManager.getNextMessageId(), channel.Id, text, type, true, extraText));
        
        if (res.StatusCode !== StatusCode.SUCCESS) return null;

        return this.chatFromChatlog(res.Chatlog!);
    }

    async sendMedia(channel: ChatChannel, template: MediaTemplates): Promise<Chat | null> {
        return this.mediaManager.sendMedia(channel, template);
    }
    
    async sendTemplate(channel: ChatChannel, template: MessageTemplate): Promise<Chat | null> {
        let sentType = template.getType();
        let text = template.getText();
        let extra = template.getExtra();

        let res = await this.client.NetworkManager.requestPacketRes<PacketMessageWriteRes>(new PacketMessageWriteReq(this.client.ChatManager.getNextMessageId(), channel.Id, text, sentType, true, extra));

        if (res.StatusCode !== StatusCode.SUCCESS) return null;

        return this.chatFromWriteRes(res, text, extra);
    }

    chatFromChatlog(chatLog: ChatlogStruct): Chat | null {
        let channel = this.Client.ChannelManager.get(chatLog.channelId);

        if (!channel) return null;

        let sender = this.Client.UserManager.get(chatLog.senderId);

        const TypedChat = TypeMap.getChatConstructor(chatLog.type);

        return new TypedChat(channel, sender, chatLog.messageId, chatLog.logId, chatLog.prevLogId, chatLog.sendTime, chatLog.text, chatLog.rawAttachment);
    }

    async deleteChat(channelId: Long, logId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketDeleteChatRes>(new PacketDeleteChatReq(channelId, logId));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }
    
}