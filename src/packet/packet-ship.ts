/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatType } from "../talk/chat/chat-type";

export class PacketShipReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,
        public Size: Long = Long.ZERO,
        public Checksum: string = '',
        public Ext: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'SHIP';
    }

    toBodyJson() {
        return {
            'c': this.ChannelId,
            't': this.Type,
            's': this.Size,
            'cs': this.Checksum,
            'e': this.Ext
        }
    }

}

export class PacketShipRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Key: string = '',
        public Host: string = '',
        public Port: number = 0,
        public VHost: string = '',
        public VHostV6: string = ''
    ) {
        super(status);
    }

    get PacketName() {
        return 'SHIP';
    }

    readBodyJson(rawData: any) {
        this.Key = rawData['k'];
        this.Host = rawData['h'];
        this.Port = rawData['p'];
        this.VHost = rawData['vh'];
        this.VHostV6 = rawData['vh6'];
    }

}