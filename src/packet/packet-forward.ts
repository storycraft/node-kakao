/*
 * Created on Tue Sep 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatType } from "../talk/chat/chat-type";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketForwardReq extends LocoBsonRequestPacket {

    constructor(
        public MessageId: number = 0,
        public ChannelId: Long = Long.ZERO,
        public Text: string = '',
        public Type: ChatType = ChatType.Text,
        public NoSeen: boolean = false,
        public Extra: string = ''
    ) {
        super();
    }
    
    get PacketName() {
        return 'FORWARD';
    }
    
    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'msgId': this.MessageId,
            'msg': this.Text,
            'type': this.Type,
            'noSeen': this.NoSeen,
            'extra': this.Extra
        };
    }

}


export class PacketForwardRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'FORWARD';
    }
    
    readBodyJson(rawBody: any) {
        if (rawBody['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawBody['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}