/*
 * Created on Sun Jun 21 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Long } from "bson";
import { Serializer } from "json-proxy-mapper/dist/serializer";

export class PacketLinkDeletedRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkId: Long = Long.ZERO,
        public OpenToken: number = 0,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'LNKDELETED';
    }

    readBodyJson(body: any): void {
        this.LinkId = body['li'];
        this.OpenToken = body['otk'];

        if (body['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(body['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}