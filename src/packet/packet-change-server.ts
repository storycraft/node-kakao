/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";

export class PacketChangeServerRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
    ) {
        super(status);
    }

    get PacketName() {
        return 'CHANGESVR';
    }

    readBodyJson(rawData: any) {
        
    }

}