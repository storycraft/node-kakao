import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketMessageReadRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: number = -1,
        public ReaderId: number = -1,
        public Watermark: number = 0
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