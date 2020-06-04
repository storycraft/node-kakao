/*
 * Created on Sat May 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ClientStatus } from "../client-status";

export class PacketSetStatusReq extends LocoBsonRequestPacket {

    constructor(
        public Status: ClientStatus = ClientStatus.UNLOCKED
    ) {
        super();
    }


    get PacketName() {
        return 'SETST';
    }

    toBodyJson() {
        return {
            'st': this.Status
        }
    }


}

export class PacketSetStatusRes extends LocoBsonResponsePacket {

    get PacketName() {
        return 'SETST';
    }

    readBodyJson(rawData: any) {
        
    }

}