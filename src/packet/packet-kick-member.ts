import { LocoBsonRequestPacket } from "./loco-bson-packet";
import { Long } from "bson";

/*
 * Created on Sat Dec 28 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketKickMemberReq extends LocoBsonRequestPacket {

    constructor(
        public ClientOpenUserId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public MemberId: Long = Long.ZERO,
    ) {
        super();
    }

    get PacketName(): string {
        return 'KICKMEM';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.ClientOpenUserId,
            'c': this.ChannelId,
            'mid': this.MemberId,
        };

        return obj;
    }
}