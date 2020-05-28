/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket } from "./loco-bson-packet";
import { ChatType } from "../talk/chat/chat-type";

export class PacketGetTrailerReq extends LocoBsonRequestPacket {

    constructor(
        public Key: string = '',
        public Type: ChatType = ChatType.Text
    ) {
        super();
    }

    get PacketName() {
        return 'GETTRAILER';
    }

    toBodyJson() {
        return {
            'k': this.Key,
            't': this.Type
        }
    }

}