import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { MessageType } from "../talk/chat/message-type";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketInvoiceRes extends LocoBsonResponsePacket {
    
    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public Type: MessageType = MessageType.Text,
        public Extra: string = ''

        ) {
        super(status);
    }

    get PacketName() {
        return 'INVOICE';
    }

    readBodyJson(body: any) {
        this.ChannelId = JsonUtil.readLong(body['c']);

        this.Type = body['t'];

        this.Extra = body['ex'] || '{}';
    }

}