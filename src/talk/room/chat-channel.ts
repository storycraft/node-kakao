import { ChatUser } from "../user/chat-user";
import { Long } from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatInfoStruct, ChatInfoMeta } from "../struct/chatinfo-struct";
import { EventEmitter } from "events";
import { Chat } from "../chat/chat";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 1800000;

    private channelId: Long;

    private lastInfoUpdate: number;

    private lastChat: Chat |null;

    private channelInfo: ChannelInfo;

    constructor(channelId: Long, roomType?: ChatroomType) {
        super();

        this.channelId = channelId;

        this.lastInfoUpdate = -1;

        this.channelInfo = new ChannelInfo(this, roomType || ChatroomType.GROUP);
        this.lastChat = null;
    }

    get LastChat() {
        return this.lastChat;
    }

    get ChannelId() {
        return this.channelId;
    }

    get LastInfoUpdate() {
        return this.lastInfoUpdate;
    }

    set LastInfoUpdate(value: number) {
        this.lastInfoUpdate = value;
    }

    get ChannelInfo() {
        return this.channelInfo;
    }

    getNextMessageId() {
        if (this.lastChat) {
            return this.lastChat.MessageId + 1;
        }

        return 0;
    }

    chatReceived(chat: Chat) {
        if (chat.Channel !== this) {
            throw new Error('Pointed to wrong channel');
        }

        this.lastChat = chat;

        this.emit('message', chat);
    }

    on(event: 'message' | string, listener: (chat: Chat) => void): this;
    on(event: 'join' | string, listener: (newUser: ChatUser, joinMessage: string) => void): this;
    on(event: 'left' | string, listener: (leftUser: ChatUser) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'message' | string, listener: () => void): this;
    once(event: 'join' | string, listener: (newUser: ChatUser, joinMessage: string) => void): this;
    once(event: 'left' | string, listener: (leftUser: ChatUser) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}

export class ChannelInfo {

    private channel: ChatChannel;

    private roomType: ChatroomType;

    private infoLoaded: boolean;

    private lastInfoUpdated: number;

    private isDirectChan: boolean;

    private chatmetaList: ChatInfoMeta[];

    private userMap: Map<string, ChatUser>;

    constructor(channel: ChatChannel, roomType: ChatroomType) {
        this.channel = channel;
        this.infoLoaded = false;
        
        this.roomType = roomType;

        this.lastInfoUpdated = -1;
        this.userMap = new Map();


        this.chatmetaList = [];
        this.isDirectChan = false;
    }

    get Channel() {
        return this.channel;
    }

    get RoomType() {
        return this.roomType;
    }

    get InfoLoaded() {
        return this.infoLoaded;
    }

    get IsDirectChan() {
        return this.isDirectChan;
    }

    get LastInfoUpdated() {
        return this.lastInfoUpdated;
    }

    get UserList() {
        return Array.from(this.userMap.values());
    }

    get ChatMetaList() {
        return this.chatmetaList;
    }

    hasUser(id: Long) {
        return this.userMap.has(id.toString());
    }

    getUser(id: Long): ChatUser {
        if (!this.hasUser(id)) {
            throw new Error('Invalid user');
        }

        return this.userMap.get(id.toString())!;
    }

    addUserJoined(userId: Long, joinMessage: string): ChatUser {
        if (this.hasUser(userId)) {
            throw new Error('This user is already joined');
        }

        let newUser = new ChatUser(userId);

        this.userMap.set(userId.toString(), newUser);
        this.Channel.emit('join', newUser, joinMessage);
        
        return newUser;
    }

    removeUserLeft(id: Long): ChatUser {
        let user = this.getUser(id);

        this.userMap.delete(id.toString());
        this.Channel.emit('left', user);

        return user;
    }

    update(chatinfoStruct: ChatInfoStruct) {
        if (!this.infoLoaded) {
            this.infoLoaded = true;
        }

        this.lastInfoUpdated = Date.now();

        let checkedList: Long[] = [];

        for (let memberStruct of chatinfoStruct.MemberList) {
            let user: ChatUser;
            if (!this.hasUser(memberStruct.UserId)) {
                user = this.addUserJoined(memberStruct.UserId, '');
            } else {
                user = this.getUser(memberStruct.UserId);
            }
            user.UserInfo.update(memberStruct);

            checkedList.push(user.UserId);
        }

        for (let user of this.UserList) {
            if (!checkedList.includes(user.UserId)) {
                this.removeUserLeft(user.UserId);
            }
        }

        this.isDirectChan = chatinfoStruct.IsDirectChat;
        this.chatmetaList = chatinfoStruct.ChatMetaList;

        chatinfoStruct.Type;
    }

}