import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ChatroomType } from "../chat/chatroom-type";
import { ChatlogStruct } from "./chatlog-struct";
import { ChatDataMetaStruct } from "./chatdata-struct";
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
        public ChannelId: Long = Long.fromNumber(0),
        public Type: ChatroomType = ChatroomType.GROUP,
        public ActiveMemberCount: number = 0,
        public NewMessageCount: number = 0,
        public LastUpdatedAt: string | null = null,
        public LastMessage: string | null = null,
        public LastLogId: Long = Long.fromNumber(-1),
        public LastSeenLogId: Long = Long.fromNumber(-1),
        public LastChatLog: ChatlogStruct | null = null,
        public Meta: null = null, //idk what is this
        public MemberList: MemberStruct[] = [],
        public PushAlert: boolean = false,
        public ChatMetaList: ChatInfoMeta[] = [],
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

        this.Meta = rawJson['meta'];

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
                let infoMeta = new ChatInfoMeta();
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

        if (this.Meta) {

        }

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

export class ChatInfoMeta implements StructBase {

    constructor(
        public Type: number = 0,
        public Revision: Long = Long.fromNumber(0),
        public AuthorId: Long = Long.fromNumber(0),
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