import { LocoBsonResponsePacket } from "./loco-bson-packet";
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
        public ChannelId: Long = Long.fromNumber(-1),
        public ReaderId: Long = Long.fromNumber(-1),
        public Watermark: Long = Long.fromNumber(-1),
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