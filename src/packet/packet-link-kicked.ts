/*
 * Created on Sun May 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

export class PacketLinkKickedRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public Chatlog: ChatlogStruct = new ChatlogStruct()
    ) {
        super(status);
    }

    get PacketName() {
        return 'LINKKICKED';
    }

    readBodyJson(body: any): void {
        this.ChannelId = body['c'];

        if (body['chatLog']) {
            this.Chatlog.fromJson(body['chatLog']);
        }
    }

}