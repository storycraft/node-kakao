import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketNewMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'NEWMEM';
    }

    readBodyJson(body: any) {
        if (body['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(body['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}