import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

/*
 * Created on Sat Dec 28 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketDeleteLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
    ) {
        super();
    }

    get PacketName(): string {
        return 'DELETELINK';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.LinkId
        };

        return obj;
    }
}

export class PacketDeleteLinkRes extends LocoBsonResponsePacket {

    get PacketName(): string {
        return 'DELETELINK';
    }

    readBodyJson(body: any): void {
        
    }

}