/*
 * Created on Mon Apr 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "./chat-type";
import { TextChat, Chat, SinglePhotoChat, MultiPhotoChat, VideoChat, StaticEmoticonChat, AnimatedEmoticonChat, SharpSearchChat, ReplyChat, FeedChat, CustomChat, UnknownChat } from "./chat";
import { Long } from "bson";
import { ChatChannel } from "../channel/chat-channel";
import { ChatUser } from "../user/chat-user";

export namespace ChatDeserializeMap {

    export type ChatConstructor = new (channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number, text: string, rawAttachment: string | undefined) => Chat;

}

export class ChatDeserializeMap {
    
    private static typeMap: Map<ChatType, ChatDeserializeMap.ChatConstructor> = new Map();

    private static defaultConstructor: ChatDeserializeMap.ChatConstructor = UnknownChat;

    static init() {
        this.typeMap.set(ChatType.Feed, FeedChat);
        this.typeMap.set(ChatType.Text, TextChat);
        this.typeMap.set(ChatType.Photo, SinglePhotoChat);
        this.typeMap.set(ChatType.MultiPhoto, MultiPhotoChat);
        this.typeMap.set(ChatType.Video, VideoChat);
        this.typeMap.set(ChatType.Sticker, StaticEmoticonChat);
        this.typeMap.set(ChatType.StickerAni, AnimatedEmoticonChat);
        this.typeMap.set(ChatType.Search, SharpSearchChat);
        this.typeMap.set(ChatType.Reply, ReplyChat);
        this.typeMap.set(ChatType.Custom, CustomChat);
    }

    static get DefaultConstructor() {
        return this.defaultConstructor;
    }

    static getChatConstructor(type: ChatType): ChatDeserializeMap.ChatConstructor {
        return this.typeMap.get(type) || this.defaultConstructor;
    }

}

ChatDeserializeMap.init();