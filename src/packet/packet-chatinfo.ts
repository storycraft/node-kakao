import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";

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
        public ChatInfo: ChatInfoStruct = new ChatInfoStruct()
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHATINFO';
    }

    readBodyJson(rawJson: any) {
        this.ChatInfo = new ChatInfoStruct();

        if (rawJson['chatInfo']) {
            this.ChatInfo.fromJson(rawJson['chatInfo']);
        }
    }

}