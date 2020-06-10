/*
 * Created on Thu Jun 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChannelDataStruct } from "../talk/struct/channel-data-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketChannelListReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelIdList: Long[] = [],
        public MaxIdList: Long[] = [],
        public LastTokenId: Long = Long.ZERO,
        public LastChatId: Long = Long.ZERO
    ) {
        super();
    }
    
    get PacketName() {
        return 'LCHATLIST';
    }

    toBodyJson() {
        return {
            'chatIds': this.ChannelIdList,
            'maxIds': this.MaxIdList,
            'lastTokenId': this.LastTokenId,
            'lastChatId': this.LastChatId
        };
    }

}

export class PacketChannelListRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChatDataList: ChannelDataStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'LCHATLIST';
    }

    readBodyJson(rawData: any) {
        this.ChatDataList = [];
        if (rawData['chatDatas']) {
            for (let chatData of rawData['chatDatas']) {
                this.ChatDataList.push(Serializer.deserialize(chatData, ChannelDataStruct.MAPPER));
            }
        }

    }

}