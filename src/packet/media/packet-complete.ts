/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "../loco-bson-packet";
import { ChatlogStruct } from "../../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketCompleteRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'COMPLETE';
    }

    readBodyJson(rawData: any) {
        if (rawData['chatLog']) this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
    }

}