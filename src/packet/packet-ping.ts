import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";

/*
 * Created on Thu Jan 16 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketPingReq extends LocoBsonRequestPacket {

    get PacketName() {
        return 'PING';
    }

    toBodyJson() {
        return {

        };
    }

}

export class PacketPingRes extends LocoBsonResponsePacket {

    get PacketName() {
        return 'PING';
    }

    readBodyJson() {
        
    }

}