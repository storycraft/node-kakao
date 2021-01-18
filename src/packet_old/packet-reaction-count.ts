/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { LinkReactionType } from "../talk/struct/open/open-link-struct";

export class PacketReactionCountReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'REACTCNT';
    }

    toBodyJson() {
        return {
            'li': this.LinkId
        };
    }

}

export class PacketReactionCountRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkId: Long = Long.ZERO,
        public ReactType: LinkReactionType = LinkReactionType.NORMAL,
        public ReactionCount: Long = Long.ZERO
    ) {
        super(status);
    }

    get PacketName() {
        return 'REACTCNT';
    }

    readBodyJson(rawData: any) {
        this.LinkId = rawData['li'];
        this.ReactType = rawData['rt'];
        this.ReactionCount = rawData['rc'];
    }

}