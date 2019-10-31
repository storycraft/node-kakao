import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketNewMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog: ChatlogStruct = new ChatlogStruct()
    ) {
        super(status);
    }

    get PacketName() {
        return 'NEWMEM';
    }

    readBodyJson(body: any) {
        this.Chatlog = new ChatlogStruct();
        
        if (body['chatLog']) {
            this.Chatlog.fromJson(body['chatLog']);
        }
    }

}