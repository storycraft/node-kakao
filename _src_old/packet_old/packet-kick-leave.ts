/*
 * Created on Sun Aug 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketKickLeaveReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'KICKLEAVE';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'c': this.ChannelId
        }
    }

}

export class PacketKickLeaveRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LastTokenId: Long = Long.ZERO
    ) {
        super(status);
    }

    get PacketName() {
        return 'KICKLEAVE';
    }

    readBodyJson(rawBody: any) {
        this.LastTokenId = rawBody['lastTokenId'];
    }

}