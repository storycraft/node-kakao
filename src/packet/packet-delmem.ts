/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { LocoBsonResponsePacket } from "./loco-bson-packet";

export class PacketDeleteMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Chatlog: ChatlogStruct = new ChatlogStruct(),
    ) {
        super(status);
    }

    get PacketName() {
        return 'DELMEM';
    }

    readBodyJson(rawJson: any) {
        if (rawJson['chatLog']) {
            this.Chatlog.fromJson(rawJson['chatLog']);
        }
    }

}