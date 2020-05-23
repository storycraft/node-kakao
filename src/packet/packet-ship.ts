/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatType } from "../talk/chat/chat-type";

export class PacketShipReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,
        public Size: Long = Long.ZERO,
        public Checksum: string = '',
        public E: string = '',
        public Extra: string = '',
    ) {
        super();
    }

    get PacketName() {
        return 'SHIP';
    }

    toBodyJson() {
        return {
            'c': this.ChannelId,
            't': this.Type,
            's': this.Size,
            'cs': this.Checksum,
            'e': this.E,
            'ex': this.Extra
        }
    }

}