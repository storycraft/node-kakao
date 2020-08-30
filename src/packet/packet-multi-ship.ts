/*
 * Created on Sun Aug 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatType } from "../talk/chat/chat-type";

export class PacketMultiShipReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,

        public SizeList: Long[] = [],
        public ChecksumList: string[] = [],
        
        public ExtList: string[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'MSHIP';
    }

    toBodyJson() {
        return {
            'c': this.ChannelId,
            't': this.Type,
            'sl': this.SizeList,
            'csl': this.ChecksumList,
            'el': this.ExtList
        };
    }

}

export class PacketMultiShipRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public KeyList: string[] = [],
        public HostList: string[] = [],
        public PortList: number[] = [],
        public VHostList: string[] = [],
        public VHostV6List: string[] = [],
        public MimeTypeList: string[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'MSHIP';
    }

    readBodyJson(rawBody: any) {
        if (rawBody['kl']) this.KeyList = rawBody['kl'];
        if (rawBody['hl']) this.HostList = rawBody['hl'];
        if (rawBody['pl']) this.PortList = rawBody['pl'];
        if (rawBody['vhl']) this.VHostList = rawBody['vhl'];
        if (rawBody['vh6l']) this.VHostV6List = rawBody['vh6l'];
        if (rawBody['mtl']) this.MimeTypeList = rawBody['mtl'];
    }

}