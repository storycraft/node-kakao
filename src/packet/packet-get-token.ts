/*
 * Created on Thu May 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket } from "./loco-bson-packet";

export class PacketGetToken extends LocoBsonRequestPacket {

    constructor(
        public wtfList: number[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'GETTOKEN';
    }

    toBodyJson() {
        return {
            'ts': this.wtfList
        }
    }

}