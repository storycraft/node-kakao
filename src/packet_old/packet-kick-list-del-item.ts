/*
 * Created on Sun Jun 14 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketKickListDelItemReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public MemberId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'KLDELITEM';
    }

    toBodyJson() {
        return {
            li: this.LinkId,
            c: this.ChannelId,
            kid: this.MemberId
        };
    }

}

export class PacketKickListDelItemRes extends LocoBsonResponsePacket {

    constructor(
        status: number
    ) {
        super(status);
    }

    get PacketName() {
        return 'KLDELITEM';
    }

    readBodyJson(rawData: any) {
        
    }

}