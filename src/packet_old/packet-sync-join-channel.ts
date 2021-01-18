import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Long } from "..";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketSyncJoinChannelRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public Chatlog?: ChatlogStruct
        ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCJOIN';
    }

    readBodyJson(rawJson: any) {
        this.ChannelId = JsonUtil.readLong(rawJson['c']);

        if (rawJson['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawJson['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}