import { ChatUser } from "../user/chat-user";
import { Long } from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatInfoStruct, ChatInfoMeta } from "../struct/chatinfo-struct";
import { EventEmitter } from "events";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel extends EventEmitter {

    static readonly INFO_UPDATE_INTERVAL: number = 1800000;

    private channelId: Long;

    private lastInfoUpdate: number;
    
    private roomType: ChatroomType;

    private channelInfo: ChannelInfo;

    constructor(channelId: Long, roomType: ChatroomType) {
        super();

        this.channelId = channelId;
        this.roomType = roomType;

        this.lastInfoUpdate = -1;

        this.channelInfo = new ChannelInfo();
    }

    get ChannelId() {
        return this.channelId;
    }

    get RoomType() {
        return this.roomType;
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

}

export class ChannelInfo {

    private infoLoaded: boolean;

    private lastInfoUpdated: number;

    private isDirectChan: boolean;

    private chatmetaList: ChatInfoMeta[];

    private userMap: Map<string, ChatUser>;

    constructor() {
        this.infoLoaded = false;

        this.lastInfoUpdated = -1;
        this.userMap = new Map();

        this.chatmetaList = [];
        this.isDirectChan = false;
    }

    get InfoLoaded() {
        return this.infoLoaded;
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

    addUserJoined(newUser: ChatUser) {
        if (this.hasUser(newUser.UserId)) {
            throw new Error('This user is already joined');
        }

        this.userMap.set(newUser.UserId.toString(), newUser);
    }

    removeUserLeft(id: Long) {
        if (!this.hasUser(id)) {
            throw new Error('This user is not joined');
        }

        this.userMap.delete(id.toString());
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
                user = new ChatUser(memberStruct.UserId);
                this.addUserJoined(user);
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
    }

}