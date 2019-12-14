import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "..";
import { JsonUtil } from "../util/json-util";
import { ChannelBoardType } from "../talk/struct/channel-board-meta-struct";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketGetChannelBoardMetaReq extends LocoBsonRequestPacket {
    
    constructor(
        public ChannelId: Long = Long.ZERO,
        public MetaTypeList: ChannelBoardType[] = []
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

export class PacketGetMoimMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETMOMETA';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        console.log(JSON.stringify(rawData));
    }

}