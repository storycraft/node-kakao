import { LocoBsonResponsePacket } from "./loco-bson-packet";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketKickoutRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Reason: number = -1
    ) {
        super(status);
    }

    get PacketName() {
        return 'KICKOUT';
    }

    readBodyJson(body: any) {
        this.Reason = body['reason'];
    }

}