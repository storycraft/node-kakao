/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketSyncDeleteMessageRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public TraceId: number = 0,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }

    get PacketName(): string {
        return 'SYNCDLMSG';
    }

    readBodyJson(rawData: any): void {
        this.TraceId = rawData['traceId'];

        if (rawData['chatLog']) this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
    }



}