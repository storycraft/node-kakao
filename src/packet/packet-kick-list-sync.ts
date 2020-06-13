/*
 * Created on Sun Jun 14 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketKickListSyncReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'KLSYNC';
    }

    toBodyJson() {
        return { li: this.LinkId };
    }

}

export class PacketKickListSyncRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
    ) {
        super(status);
    }

    get PacketName() {
        return 'KLSYNC';
    }

    readBodyJson(rawData: any) {
        
    }

}