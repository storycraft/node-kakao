import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChannelInfoStruct } from "../talk/struct/channel-info-struct";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Wed Mar 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketSyncJoinOpenchatRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public OpenId: Long = Long.ZERO,
        public ChatInfo?: ChannelInfoStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCLINKCR';
    }

    readBodyJson(rawBody: any) {
        this.OpenId = JsonUtil.readLong(rawBody['ol']);

        if (rawBody['chatRoom']) {
            this.ChatInfo = Serializer.deserialize<ChannelInfoStruct>(rawBody['chatRoom'], ChannelInfoStruct.MAPPER);
        }
    }

}