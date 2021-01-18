/*
 * Created on Tue Jun 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketUpdateChannelReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public PushAlert: boolean = true
    ) {
        super();
    }

    get PacketName() {
        return 'UPDATECHAT';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'pushAlert': this.PushAlert
        }
    }

}

export class PacketUpdateChannelRes extends LocoBsonResponsePacket {

    get PacketName() {
        return 'UPDATECHAT';
    }

    readBodyJson() {

    }

}