/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkClient } from "../../talk-client";
import { ChatDeserializeMap } from "./chat-deserialize-map";
import { ChatlogStruct } from "../struct/chatlog-struct";

export class ChatManager {
    
    private messageId: number;

    constructor(private client: TalkClient) {
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

    async chatFromChatlog(chatLog: ChatlogStruct) {
        let channel = await this.Client.ChannelManager.get(chatLog.ChannelId);
        let sender = await this.Client.UserManager.get(chatLog.SenderId);

        const TypedChat = ChatDeserializeMap.getChatConstructor(chatLog.Type);
        return new TypedChat(channel, sender, chatLog.MessageId, chatLog.LogId, chatLog.PrevLogId, chatLog.SendTime, chatLog.Text, chatLog.RawAttachment);
    }
    
}