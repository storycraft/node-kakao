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
 */

export class PacketUpdateOpenLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public LinkName: string = '',
        public LinkImagePath?: string,
        public UserLimit?: number,
        public ChannelLimit?: number,
        public Passcode: string = '',
        public Description: string = '',
        public CanSearchLink: boolean = false,
        public Activated: boolean = false,
        public UNKNOWN2: boolean = false,
    ) {
        super();
    }

    get PacketName() {
        return 'UPDATELINK';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.LinkId,
            'ln': this.LinkName,
            'ml': this.UserLimit,
            'ac': this.Activated,
            'pa': this.UNKNOWN2,
            'pc': this.Passcode,
            'desc': this.Description,
            'sc': this.CanSearchLink,
        };

        if (typeof(this.LinkImagePath) === 'string') obj['lip'] = this.LinkImagePath;

        if (typeof(this.ChannelLimit) === 'number') obj['dcl'] = this.ChannelLimit;
        if (typeof(this.UserLimit) === 'number') obj['ml'] = this.UserLimit;


        return obj;
    }

}

export class PacketUpdateOpenLinkRes extends LocoBsonResponsePacket {

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
