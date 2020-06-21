/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChannelMetaType, ChannelMetaStruct } from "../talk/struct/channel-meta-struct";
import { JsonUtil } from "../util/json-util";

export class PacketSetMetaReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChannelMetaType = ChannelMetaType.UNDEFINED,
        public Content: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'SETMETA';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'type': this.Type,
            'content': this.Content
        };
    }

}

export class PacketSetMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public Meta?: ChannelMetaStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'SETMETA';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['chatId']);

        if (rawData['meta']) {
            this.Meta = rawData['meta'] as ChannelMetaStruct;
        }
    }

}