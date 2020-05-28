import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";
import { Serializer } from "json-proxy-mapper";

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
            this.LinkList.push(Serializer.deserialize<OpenLinkStruct>(raw, OpenLinkStruct.MAPPER));
        }
    }

}