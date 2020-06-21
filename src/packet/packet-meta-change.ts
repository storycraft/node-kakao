/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChannelMetaStruct } from "../talk/struct/channel-meta-struct";
import { JsonUtil } from "../util/json-util";

export class PacketMetaChangeRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public Meta?: ChannelMetaStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHGMETA';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['chatId']);

        if (rawData['meta']) {
            this.Meta = rawData['meta'] as ChannelMetaStruct;
        }
    }

}