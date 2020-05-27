/*
 * Created on Thu May 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

export class PacketMultiChatlogReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelIdList: Long[] = [],
        public SinceList: number[] = [],
    ) {
        super();
    }

    get PacketName() {
        return 'MCHATLOGS';
    }

    toBodyJson() {
        return {
            'chatIds': this.ChannelIdList,
            'sinces': this.SinceList
        }
    }

}

export class PacketMultiChatlogRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChatlogList: ChatlogStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'MCHATLOGS';
    }

    readBodyJson(rawData: any) {
        if (rawData['chatLogs']) {
            this.ChatlogList = [];

            for (let rawChatlog of rawData['chatLogs']) {
                let chatLog = new ChatlogStruct();
                chatLog.fromJson(rawChatlog);

                this.ChatlogList.push(chatLog);
            }
        }
    }

}