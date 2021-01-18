/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { JsonUtil } from "../util/json-util";

export class PacketGetClientMetaReq extends LocoBsonRequestPacket {

    constructor(

    ) {
        super();
    }

    get PacketName() {
        return 'GETMCMETA';
    }

    toBodyJson() {
        return { };
    }

}

export class PacketGetClientMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelIdList: Long[] = [],
        public RawClientMetaList: string[] = []
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'GETMCMETA';
    }

    readBodyJson(rawData: any) {
        this.ChannelIdList = [];
        if (rawData['chatIds']) {
            for (let channelId of rawData['chatIds']) {
                this.ChannelIdList.push(JsonUtil.readLong(channelId));
            }
        }

        this.RawClientMetaList = [];
        if (rawData['metas']) {
            for (let rawMeta of rawData['metas']) {
                this.RawClientMetaList.push(rawMeta);
            }
        }
    }

}