/*
 * Created on Sat Jun 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketSyncRewriteRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'SYNCREWR';
    }

    readBodyJson(rawData: any): void {
        if (!rawData['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
        }
    }
}