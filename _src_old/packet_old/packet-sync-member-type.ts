/*
 * Created on Wed May 06 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long, OpenMemberType } from "..";
import { JsonUtil } from "../util/json-util";

export class PacketSyncMemberTypeRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public MemberIdList: Long[] = [],
        public MemberTypeList: OpenMemberType[] = [],
    ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCMEMT';
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
    }

}