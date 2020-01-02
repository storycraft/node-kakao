import { JsonUtil } from "../util/json-util";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";

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
                let linkStruct = new OpenLinkStruct();
                linkStruct.fromJson(rawStruct);
                this.LinkList.push(linkStruct);
            }
        }
        
        this.IdList = body['dlis'];
        this.OpenChatToken = body['ltk'];
    }
}