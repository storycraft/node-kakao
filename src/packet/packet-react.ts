/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketReactReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public React: number = 0 // wtf
    ) {
        super();
    }

    get PacketName() {
        return 'REACT';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'rt': this.React
        };
    }

}

export class PacketReactRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
    ) {
        super(status);
    }

    get PacketName() {
        return 'REACT';
    }

    readBodyJson(rawData: any) {
        
    }

}