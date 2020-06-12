/*
 * Created on Tue Jun 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";


/*
 *  TODO:
 *    - What is 'pa'?
 *    - What is 'ac'?
 */

export class PacketUpdateOpenChannelReq extends LocoBsonRequestPacket {


    constructor(
        public channelId: Long = Long.ZERO,
        public title: string = '',
        public maxPeople: number = 100,
        public password: string = '', // '' is disable password
        public description: string = '',
        public canSearchLink: boolean = true,
        public UNKNOWN1: boolean = true,
        public UNKNOWN2: boolean = true,
    ) {
        super();
    }

    get PacketName() {
        return 'UPDATELINK';
    }

    toBodyJson() {
        return {
            'li': this.channelId,
            'ln': this.title,
            'ml': this.maxPeople,
            'ac': this.UNKNOWN1,
            'pa': this.UNKNOWN2,
            'pc': this.password,
            'desc': this.description,
            'sc': this.canSearchLink,
        };
    }

}

export class PacketUpdateOpenChannelRes extends LocoBsonResponsePacket {
    constructor(
        status: number,
        public ol: any = null,
    ) {
        super(status);
    }

    get PacketName() {
        return 'UPDATELINK';
    }

    readBodyJson(rawData: any) {
        this.ol = rawData['ol'];
    }

}
