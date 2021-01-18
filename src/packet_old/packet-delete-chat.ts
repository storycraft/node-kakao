import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

/*
 * Created on Tue Jan 14 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketDeleteChatReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public LogId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'DELETEMSG';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'logId': this.LogId
        };
    }

}

export class PacketDeleteChatRes extends LocoBsonResponsePacket {

    get PacketName() {
        return 'DELETEMSG';
    }

    readBodyJson(body: any) {

    }

}