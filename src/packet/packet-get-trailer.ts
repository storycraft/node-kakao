/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatType } from "../talk/chat/chat-type";

export class PacketGetTrailerReq extends LocoBsonRequestPacket {

    constructor(
        public Key: string = '',
        public Type: ChatType = ChatType.Text
    ) {
        super();
    }

    get PacketName() {
        return 'GETTRAILER';
    }

    toBodyJson() {
        return {
            'k': this.Key,
            't': this.Type
        }
    }

}

export class PacketGetTrailerRes extends LocoBsonResponsePacket {
    
    constructor(
        status: number,
        public Host: string = '',
        public Port: number = 0,
        public VHost: string = '',
        public VHostV6: string = ''
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETTRAILER';
    }

    readBodyJson(rawData: any) {
        this.Host = rawData['h'];
        this.Port = rawData['p'];
        this.VHost = rawData['vh'];
        this.VHostV6 = rawData['vh6'];
    }

}