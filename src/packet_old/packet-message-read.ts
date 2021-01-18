import { LocoBsonResponsePacket, LocoBsonRequestPacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketMessageReadRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public ReaderId: Long = Long.ZERO,
        public Watermark: Long = Long.ZERO, //chat log id
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'DECUNREAD';
    }
    
    readBodyJson(body: any) {
        this.ChannelId = JsonUtil.readLong(body['chatId']);
        this.ReaderId = JsonUtil.readLong(body['userId']);
        this.Watermark = JsonUtil.readLong(body['watermark']);
    }

}