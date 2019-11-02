import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketChatInfoReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.fromNumber(0),
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
        public ChannelId: number = 0
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHATINFO';
    }

    readBodyJson(rawJson: any) {
        console.log(rawJson);
    }

}