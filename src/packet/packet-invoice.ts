import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { MessageType } from "./packet-message";

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

//INVOICE -> {"status":0,"k":"dctTq/oXqraYFdBe/6toK5LBB7LAgEKjUbcuxm1/i_6dnih14avyif.jpg","s":12612,"mt":"","c":{"low":-257791270,"high":4244966,"unsigned":false},"t":2,"h":"210.103.250.106","p":5228,"vh":"203.217.229.59","vh6":"2404:4600:4:35:203:217A:229:59","ex":"{}"}