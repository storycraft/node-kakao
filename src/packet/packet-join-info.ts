/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";

export class PacketJoinInfoReq extends LocoBsonRequestPacket {

    constructor(
        public OpenLinkURL: string = '',
        public LinkRef: string = ''//default EW
    ) {
        super();
    }

    get PacketName(): string {
        return 'JOININFO';
    }

    toBodyJson() {
        return {
            'lu': this.OpenLinkURL,
            'ref': this.LinkRef
        };
    }
    
}

export class PacketJoinInfoRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public OpenLink: OpenLinkStruct = new OpenLinkStruct()
    ) {
        super(status);
    }

    get PacketName(): string {
        return 'JOININFO';
    }

    readBodyJson(body: any): void {
        this.OpenLink.fromJson(body['ol']);
    }

}