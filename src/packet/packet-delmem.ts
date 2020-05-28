/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Serializer } from "json-proxy-mapper";

export class PacketDeleteMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog?: ChatlogStruct,
    ) {
        super(status);
    }

    get PacketName() {
        return 'DELMEM';
    }

    readBodyJson(rawJson: any) {
        if (rawJson['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawJson['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}