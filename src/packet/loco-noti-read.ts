/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketMessageNotiReadReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO
    ) {
        super();
    }
    
    get PacketName() {
        return 'NOTIREAD';
    }
    
    toBodyJson() {
        return {
            'chatId': this.ChannelId
        };
    }
    
}

export class PacketMessageNotiReadRes extends LocoBsonResponsePacket {

    constructor(
        status: number
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'NOTIREAD';
    }
    
    readBodyJson(rawJson: any) {

    }
    
}