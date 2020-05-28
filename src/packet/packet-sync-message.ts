/*
 * Created on Wed May 13 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketSyncMessageReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public StartLogId: Long = Long.ZERO,
        public Count: number = 0,
        public EndLogId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName(): string {
        return 'SYNCMSG';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'cur': this.StartLogId,
            'cnt': this.Count,
            'max': this.EndLogId
        };
    }

}

export class PacketSyncMessageRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public IsOK: boolean = false,
        public ChatList: ChatlogStruct[] = [],
        public LastTokenId: Long = Long.ZERO,
        public LinkId: Long = Long.ZERO
    ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCMSG';
    }

    readBodyJson(rawJson: any) {
        this.IsOK = rawJson['isOK'];

        if (rawJson['chatLogs']) {
            for (let rawChatlog of rawJson['chatLogs']) {
                this.ChatList.push(Serializer.deserialize<ChatlogStruct>(rawChatlog, ChatlogStruct.MAPPER));
            }
        }
        
        if (rawJson['li']) this.LinkId = rawJson['li'];
        this.LastTokenId = rawJson['lastTokenId'];
    }

}