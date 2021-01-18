import { JsonUtil } from "../util/json-util";
import { OpenLinkStruct } from "../talk/struct/open/open-link-struct";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Fri Nov 22 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketSyncLinkReq extends LocoBsonRequestPacket {

    constructor(
        public OpenChatToken: number = 0,
    ) {
        super();
    }
    
    get PacketName() {
        return 'SYNCLINK';
    }
    
    toBodyJson() {
        let obj: any = {
            'ltk': this.OpenChatToken
        };

        return obj;
    }
}

export class PacketSyncLinkRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkList: OpenLinkStruct[] = [],
        public IdList: Long[] = [],
        public OpenChatToken: number = 0,

    ) {
        super(status);
    }
    
    get PacketName() {
        return 'SYNCLINK';
    }
    
    readBodyJson(body: any) {
        this.LinkList = [];

        if (body['ols']) {
            for (let rawStruct of body['ols']) {
                this.LinkList.push(Serializer.deserialize<OpenLinkStruct>(rawStruct, OpenLinkStruct.MAPPER));
            }
        }
        
        if (body['dlis']) this.IdList = body['dlis'];
        this.OpenChatToken = body['ltk'];
    }
}