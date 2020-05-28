import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketChatInfoReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
    ) {
        super();
    }

    get PacketName() {
        return 'CHATINFO';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId
        }
    }
}


export class PacketChatInfoRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChatInfo?: ChatInfoStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHATINFO';
    }

    readBodyJson(rawJson: any) {
        if (rawJson['chatInfo']) {
            this.ChatInfo = Serializer.deserialize<ChatInfoStruct>(rawJson['chatInfo'], ChatInfoStruct.MAPPER);
        }
    }

}