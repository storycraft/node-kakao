import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatlogStruct } from "./chatlog-struct";
import { MemberStruct } from "./member-struct";
import { JsonUtil } from "../../util/json-util";
import { type } from "os";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatInfoStruct implements StructBase {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChatroomType = ChatroomType.GROUP,
        public ActiveMemberCount: number = 0,
        public NewMessageCount: number = 0,
        public LastUpdatedAt: string | null = null,
        public LastMessage: string | null = null,
        public LastLogId: Long = Long.fromNumber(-1),
        public LastSeenLogId: Long = Long.fromNumber(-1),
        public LastChatLog: ChatlogStruct | null = null,
        public Meta: ChatMetaStruct = new ChatMetaStruct(), //idk what is this
        public MemberList: MemberStruct[] = [],
        public PushAlert: boolean = false,
        public ChatMetaList: ChannelMetaStruct[] = [],
        public IsDirectChat: boolean = false
    ) {

    }

    fromJson(rawJson: any) {
        this.ChannelId = JsonUtil.readLong(rawJson['chatId']);
        this.Type = rawJson['type'];
        this.ActiveMemberCount = rawJson['activeMembersCount'];
        this.NewMessageCount = rawJson['newMessageCount'];
        this.LastUpdatedAt = rawJson['lastUpdatedAt'];
        this.LastMessage = rawJson['lastMessage'];
        this.LastLogId = JsonUtil.readLong(rawJson['lastLogId']);
        this.LastSeenLogId = JsonUtil.readLong(rawJson['lastSeenLogId']);
        this.LastChatLog = null;

        if (rawJson['lastChatLog']) {
            this.LastChatLog = new ChatlogStruct();
            this.LastChatLog.fromJson(rawJson['lastChatLog']);
        }

        this.Meta = new ChatMetaStruct();

        if (rawJson['meta']) {
            this.Meta.fromJson(rawJson['meta']);
        }

        this.MemberList = [];

        if (rawJson['displayMembers']) {
            let list: any[] = rawJson['displayMembers'];

            for (let rawMember of list) {
                let memberStruct = new MemberStruct();
                memberStruct.fromJson(rawMember);

                this.MemberList.push(memberStruct);
            }
        }

        this.ChatMetaList = [];

        if (rawJson['chatMetas']) {
            let list: any[] = rawJson['chatMetas'];

            for (let rawMeta of list) {
                let infoMeta = new ChannelMetaStruct();
                infoMeta.fromJson(rawMeta);

                this.ChatMetaList.push(infoMeta);
            }
        }

        this.PushAlert = rawJson['pushAlert'];
        this.IsDirectChat = rawJson['directChat'];
    }

    toJson() {
        let obj: any = {
            'chatId': this.ChannelId,
            'type': type,
            'activeMembersCount': this.ActiveMemberCount,
            'newMessageCount': this.NewMessageCount,
            'lastUpdatedAt': this.LastUpdatedAt,
            'lastMessage': this.LastMessage,
            'lastLogId': this.LastLogId,
            'lastSeenLogId': this.LastSeenLogId,
            'lastChatLog': null,
            'meta': null,
            'pushAlert': this.PushAlert,
            'directChat': this.IsDirectChat
        };

        if (this.LastChatLog) {
            obj['lastChatLog'] = this.LastChatLog.toJson();
        }

        obj['meta'] = this.Meta;

        let displayMemList: any[] = [];

        for (let memberStruct of this.MemberList) {
            displayMemList.push(memberStruct.toJson());
        }
        obj['displayMembers'] = displayMemList;

        let chatMetaList: any[] = [];

        for (let chatInfoMetaStruct of this.ChatMetaList) {
            chatMetaList.push(chatInfoMetaStruct.toJson());
        }
        obj['chatMetas'] = chatMetaList;


        return obj;
    }

}

export class ChatMetaStruct implements StructBase {

    constructor(
        public FullImageURL: string = '',
        public ImageURL: string = '',
        public Name: string = '',
        public Favorite: boolean = false
    ) {
        
    }

    toJson() {
        return {
            'imageUrl': this.ImageURL,
            'fullImageUrl': this.FullImageURL,
            'name': this.Name,
            'favorite': this.Favorite
        }
    }

    fromJson(rawJson: any) {
        this.ImageURL = rawJson['imageUrl'];
        this.FullImageURL = rawJson['fullImageUrl'];
        this.Name = rawJson['name'];
        this.Favorite = rawJson['favorite'];
    }
}

export enum ChannelMetaType {
    NOTICE = 1,
    GROUP = 2,
    TITLE = 3,
    PROFILE = 4,
    TV = 5,
    PRIVILEGE = 6,
    TV_LIVE = 7,
    PLUS_BACKGROUND = 8,
    LIVE_TALK_INFO = 11,
    LIVE_TALK_COUNT = 12
}

export class ChannelMetaStruct implements StructBase {

    constructor(
        public Type: ChannelMetaType = 0,
        public Revision: Long = Long.ZERO,
        public AuthorId: Long = Long.ZERO,
        public Content: string = '',
        public UpdatedAt: number = -1
    ) {

    }

    toJson() {
        return {
            'type': this.Type,
            'revision': this.Revision,
            'authorId': this.AuthorId,
            'content': this.Content,
            'updateAt': this.UpdatedAt
        }
    }

    fromJson(rawJson: any) {
        this.Type = rawJson['type'];
        this.Revision = JsonUtil.readLong(rawJson['revision']);
        this.AuthorId = JsonUtil.readLong(rawJson['authorId']);
        this.Content = rawJson['content'];
        this.UpdatedAt = rawJson['updatedAt'];
    }

}