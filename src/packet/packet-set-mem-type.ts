/*
 * Created on Sun May 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenMemberType } from "../talk/open/open-member-type";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { JsonUtil } from "../util/json-util";

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
        public Chatlog: ChatlogStruct = new ChatlogStruct(),
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
            this.MemberIdList = [];
            for (let id of rawData['mids']) {
                this.MemberIdList.push(JsonUtil.readLong(id));
            }
        }

        if (rawData['mts']) {
            this.MemberIdList = rawData['mts'];
        }

        if (rawData['chatLog']) {
            this.Chatlog.fromJson(rawData['chatLog']);
        }

        if (rawData['pvs']) {
            this.Unknown1 = [];
            for (let id of rawData['pvs']) {
                this.Unknown1.push(JsonUtil.readLong(id));
            }
        }
    }

}