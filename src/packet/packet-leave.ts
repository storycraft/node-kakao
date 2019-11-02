import { LocoBsonResponsePacket, LocoBsonRequestPacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketLeaveReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.fromNumber(0)  
    ) {
        super();
    }

    get PacketName() {
        return 'LEFT';
    }

    toBodyJson() {
        return {
            'chatId': JsonUtil.readLong(this.ChannelId)
        };
    }
    
}

export class PacketLeftRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.fromNumber(0),
        public LastTokenId: Long = Long.fromNumber(0)  
    ) {
        super(status);
    }

    get PacketName() {
        return 'LEFT';
    }

    readBodyJson(body: any) {
        this.ChannelId = JsonUtil.readLong(body['chatId']);
        this.LastTokenId = JsonUtil.readLong(body['lastTokenId']);
    }
    
}