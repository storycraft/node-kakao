import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "..";
import { JsonUtil } from "../util/json-util";
import { ChannelMetaStruct, ChannelMetaType } from "../talk/struct/chat-info-struct";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketGetMetaReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public MetaTypeList: ChannelMetaType[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'GETMETA';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'types': this.MetaTypeList
        }
    }

}

export class PacketGetMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public MetaList: ChannelMetaStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETMETA';
    }

    readBodyJson(rawJson: any) {
        this.ChannelId = JsonUtil.readLong(rawJson['chatId']);

        this.MetaList = [];
        if (rawJson['metas']) {
            let list: any[] = rawJson['metas'];

            for (let rawMeta of list) {

            }
        }
    }

}

export class PacketGetMetasReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelList: Long[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'GETMETAS';
    }

    toBodyJson() {
        return {
            'cs': this.ChannelList
        }
    }

}

export class PacketGetMetasRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelList: Long[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETMETAS';
    }

    readBodyJson(rawJson: any) {
        
    }

}