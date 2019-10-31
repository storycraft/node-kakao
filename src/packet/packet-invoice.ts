import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { MessageType } from "../talk/chat/message-type";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketInvoiceRes extends LocoBsonResponsePacket {
    
    constructor(
        status: number,
        public ChannelId: number = 0,
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