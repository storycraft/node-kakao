import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";

/*
 * Created on Thu Jan 16 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketInfoLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkIdList: Long[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'INFOLINK';
    }

    toBodyJson() {
        let obj: any = {
            'lis': this.LinkIdList
        };

        return obj;
    }

}

export class PacketInfoLinkRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkList: OpenLinkStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'INFOLINK';
    }

    readBodyJson(rawBody: any) {
        let list = rawBody['ols'];

        this.LinkList = [];

        for (let raw of list) {
            let link = new OpenLinkStruct();
            link.fromJson(raw);

            this.LinkList.push(link);
        }
    }

}