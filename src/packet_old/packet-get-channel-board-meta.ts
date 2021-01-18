import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "..";
import { JsonUtil } from "../util/json-util";
import { ChannelBoardMetaType, ChannelBoardMetaStruct } from "../talk/struct/channel-board-meta-struct";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketGetChannelBoardMetaReq extends LocoBsonRequestPacket {
    
    constructor(
        public ChannelId: Long = Long.ZERO,
        public MetaTypeList: ChannelBoardMetaType[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'GETMOMETA';
    }

    toBodyJson() {
        return {
            'c': this.ChannelId,
            'ts': this.MetaTypeList
        };
    }

}

export class PacketGetChannelBoardMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public MetaList: ChannelBoardMetaStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETMOMETA';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        this.MetaList = [];
        if (rawData['ms']) {
            for (let rawMeta of rawData['ms']) {
                this.MetaList.push(Serializer.deserialize<ChannelBoardMetaStruct>(rawMeta, ChannelBoardMetaStruct.MAPPER));
            }
        }
    }

}