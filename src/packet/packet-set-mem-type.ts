/*
 * Created on Sun May 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { JsonUtil } from "../util/json-util";
import { OpenMemberType } from "../talk/open/open-link-type";
import { Serializer } from "json-proxy-mapper";

export class PacketSetMemTypeReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public MemberIdList: Long[] = [],
        public MemberTypeList: OpenMemberType[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'SETMEMTYPE';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'c': this.ChannelId,
            'mids': this.MemberIdList,
            'mts': this.MemberTypeList
        };
    }

}

export class PacketSetMemTypeRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public Chatlog?: ChatlogStruct,
        public MemberIdList: Long[] = [],
        public MemberTypeList: OpenMemberType[] = [],
        public Unknown1: Long[] = []
    ) {
        super(status);        
    }

    get PacketName() {
        return 'SETMEMTYPE';
    }

    readBodyJson(rawData: any) {
        this.LinkId = JsonUtil.readLong(rawData['li']);
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        if (rawData['mids']) {
            this.MemberIdList = rawData['mids'];
        }

        if (rawData['mts']) {
            this.MemberTypeList = rawData['mts'];
        }

        if (rawData['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
        }

        if (rawData['pvs']) {
            this.Unknown1 = [];
            for (let id of rawData['pvs']) {
                this.Unknown1.push(JsonUtil.readLong(id));
            }
        }
    }

}