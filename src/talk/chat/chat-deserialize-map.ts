/*
 * Created on Mon Apr 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { MessageType } from "./message-type";
import { TextChat, Chat, SinglePhotoChat, MultiPhotoChat, VideoChat, StaticEmoticonChat, AnimatedEmoticonChat, SharpSearchChat, ReplyChat } from "./chat";
import { Long } from "bson";
import { ChatChannel } from "../room/chat-channel";
import { ChatUser } from "../user/chat-user";

export namespace ChatDeserializeMap {

    export type ChatConstructor = new (channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number, text: string, rawAttachment: string | undefined) => Chat;

}

export class ChatDeserializeMap {
    
    private static typeMap: Map<MessageType, ChatDeserializeMap.ChatConstructor> = new Map();

    private static defaultConstructor: ChatDeserializeMap.ChatConstructor = TextChat;

    static init() {
        this.typeMap.set(MessageType.Text, TextChat);
        this.typeMap.set(MessageType.Photo, SinglePhotoChat);
        this.typeMap.set(MessageType.MultiPhoto, MultiPhotoChat);
        this.typeMap.set(MessageType.Video, VideoChat);
        this.typeMap.set(MessageType.Sticker, StaticEmoticonChat);
        this.typeMap.set(MessageType.StickerAni, AnimatedEmoticonChat);
        this.typeMap.set(MessageType.Search, SharpSearchChat);
        this.typeMap.set(MessageType.Reply, ReplyChat);
        this.typeMap.set(MessageType.KakaoLinkV2, ReplyChat);
    }

    static get DefaultConstructor() {
        return this.defaultConstructor;
    }

    static getChatConstructor(type: MessageType): ChatDeserializeMap.ChatConstructor {
        return this.typeMap.get(type) || this.defaultConstructor;
    }

}

ChatDeserializeMap.init();