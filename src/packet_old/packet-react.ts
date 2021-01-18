/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { LinkReactionType } from "../talk/struct/open/open-link-struct";

export class PacketReactReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ReactType: LinkReactionType = LinkReactionType.NONE
    ) {
        super();
    }

    get PacketName() {
        return 'REACT';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'rt': this.ReactType
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