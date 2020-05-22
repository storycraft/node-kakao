import { StructBaseOld } from "./struct-base";
import { Long } from "bson";
import { ChannelType } from "../chat/channel-type";
import { ChatlogStruct } from "./chatlog-struct";
import { MemberStruct } from "./member-struct";
import { JsonUtil } from "../../util/json-util";
import { type } from "os";
import { ChatDataBase } from "./chatdata-struct";
import { ChannelMetaStruct } from "./channel-meta-set-struct";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatInfoStruct implements ChatDataBase, StructBaseOld {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChannelType = ChannelType.GROUP,
        public OpenLinkId: Long = Long.ZERO,
        public OpenChatToken: number = -1,
        public ActiveMemberCount: number = 0,
        public NewMessageCount: number = 0,
        public LastUpdatedAt: string | null = null,
        public LastMessage: string | null = null,
        public LastLogId: Long = Long.fromNumber(-1),
        public LastSeenLogId: Long = Long.fromNumber(-1),
        public LastChatLog: ChatlogStruct | null = null,
        public readonly Metadata: ChatMetaStruct = new ChatMetaStruct(), //idk what is this
        public readonly ActiveMemberList: MemberStruct[] = [],
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

        this.OpenLinkId = Long.ZERO;
        if (rawJson['li']) {
            this.OpenLinkId = JsonUtil.readLong(rawJson['li']);
        }

        this.OpenChatToken = -1;
        if (rawJson['otk']) {
            this.OpenChatToken = rawJson['otk'];
        }

        if (rawJson['meta']) {
            this.Metadata.fromJson(rawJson['meta']);
        }

        this.ActiveMemberList.length = 0;

        if (rawJson['displayMembers']) {
            let list: any[] = rawJson['displayMembers'];

            for (let rawMember of list) {
                let memberStruct = new MemberStruct();
                memberStruct.fromJson(rawMember);

                this.ActiveMemberList.push(memberStruct);
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

        obj['meta'] = this.Metadata;

        let displayMemList: any[] = [];

        for (let memberStruct of this.ActiveMemberList) {
            displayMemList.push(memberStruct.toJson());
        }
        obj['displayMembers'] = displayMemList;

        if (this.OpenLinkId !== Long.ZERO) {
            obj['li'] = this.OpenLinkId;
        }

        this.OpenChatToken = -1;
        if (this.OpenChatToken !== -1) {
            obj['otk'] = this.OpenChatToken;
        }

        let chatMetaList: any[] = [];

        for (let chatInfoMetaStruct of this.ChatMetaList) {
            chatMetaList.push(chatInfoMetaStruct.toJson());
        }
        obj['chatMetas'] = chatMetaList;


        return obj;
    }

}

export class ChatMetaStruct implements StructBaseOld {

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