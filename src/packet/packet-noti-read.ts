/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

export class PacketMessageNotiReadReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Watermark: Long = Long.ZERO,
        public LinkId?: Long
    ) {
        super();
    }
    
    get PacketName() {
        return 'NOTIREAD';
    }
    
    toBodyJson() {
        let obj: any = {
            'chatId': this.ChannelId,
            'watermark': this.Watermark
        };

        if (this.LinkId) obj['li'] = this.LinkId;
        
        return obj;
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