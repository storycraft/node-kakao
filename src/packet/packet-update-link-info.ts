/*
 * Created on Tue Jun 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenLinkStruct } from "../talk/struct/open/open-link-struct";
import { Serializer } from "json-proxy-mapper";


/*
 *  TODO:
 *    - What is 'pa'?
 *    - What is 'ac'?
 */

export class PacketUpdateOpenChannelReq extends LocoBsonRequestPacket {


    constructor(
        public LinkId: Long = Long.ZERO,
        public LinkName: string = '',
        public MaxUser: number = 100,
        public Passcode: string = '',
        public Description: string = '',
        public CanSearchLink: boolean = true,
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
            'li': this.LinkId,
            'ln': this.LinkName,
            'ml': this.MaxUser,
            'ac': this.UNKNOWN1,
            'pa': this.UNKNOWN2,
            'pc': this.Passcode,
            'desc': this.Description,
            'sc': this.CanSearchLink,
        };
    }

}

export class PacketUpdateOpenChannelRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public OpenLink?: OpenLinkStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'UPDATELINK';
    }

    readBodyJson(rawData: any) {
        if (rawData['ol']) this.OpenLink = Serializer.deserialize<OpenLinkStruct>(rawData, OpenLinkStruct.MAPPER);
    }

}
