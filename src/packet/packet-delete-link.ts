import { LocoBsonRequestPacket } from "./loco-bson-packet";
import { Long } from "bson";

/*
 * Created on Sat Dec 28 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketDeleteLinkReq extends LocoBsonRequestPacket {

    constructor(
        public ClientOpenUserId: Long = Long.ZERO,
    ) {
        super();
    }

    get PacketName(): string {
        return 'DELETELINK';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.ClientOpenUserId
        };

        return obj;
    }
}
