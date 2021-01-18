import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChannelInfoStruct } from "../talk/struct/channel-info-struct";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketChannelInfoReq extends LocoBsonRequestPacket {

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


export class PacketChannelInfoRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChatInfo?: ChannelInfoStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHATINFO';
    }

    readBodyJson(rawJson: any) {
        if (rawJson['chatInfo']) {
            this.ChatInfo = Serializer.deserialize<ChannelInfoStruct>(rawJson['chatInfo'], ChannelInfoStruct.MAPPER);
        }
    }

}