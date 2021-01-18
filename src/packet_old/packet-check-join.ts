import { Long } from "bson";
/*
 * Created on Thu Oct 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";

export class PacketCheckJoinReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public Passcode: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'CHECKJOIN';
    }

    toBodyJson() {
        return { 'li': this.LinkId, 'pc': this.Passcode };
    }
}

export class PacketCheckJoinRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Token: string = ''
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHECKJOIN';
    }

    readBodyJson(rawBody: any) {
        this.Token = rawBody['tk'];
    }
}