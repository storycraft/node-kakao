/*
 * Created on Sat Jul 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketAddMemberReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public MemberIdList: Long[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'ADDMEM';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'memberIds': this.MemberIdList
        };
    }
}

export class PacketAddMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public MemberIdList: Long[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'ADDMEM';
    }

    readBodyJson(rawData: any) {
        
    }
}
