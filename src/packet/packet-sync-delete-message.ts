/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

export class PacketSyncDeleteMessageRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public TraceId: number = 0,
        public Chatlog: ChatlogStruct = new ChatlogStruct()
    ) {
        super(status);
    }

    get PacketName(): string {
        return 'SYNCDLMSG';
    }

    readBodyJson(rawData: any): void {
        this.TraceId = rawData['traceId'];

        if (rawData['chatLog']) this.Chatlog.fromJson(rawData['chatLog']);
    }



}