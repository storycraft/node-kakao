/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatType } from "../talk/chat/chat-type";
import { RelayEventType } from "../talk/relay/relay-event-type";

export class PacketRelayEventReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public EventType: RelayEventType = RelayEventType.UNDEFINED,
        public EventCount: number = 0,
        public LogId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,
    ) {
        super();
    }

    get PacketName() {
        return 'RELAYEVENT';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'c': this.ChannelId,
            'et': this.EventType,
            'ec': this.EventCount,
            'logId': this.LogId,
            't': this.Type
        };
    }

}

export class PacketRelayEventRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public EventType: RelayEventType = RelayEventType.UNDEFINED,
        public EventCount: number = 0,
        public LogId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,
        public AutherId: Long = Long.ZERO

    ) {
        super(status);
    }

    get PacketName() {
        return 'RELAYEVENT';
    }

    readBodyJson(rawData: any) {
        this.LinkId = rawData['li'];
        this.ChannelId = rawData['c'];
        this.EventType = rawData['et'];
        this.EventCount = rawData['ec'];
        this.LogId = rawData['logId'];
        this.Type = rawData['t'];
        this.AutherId = rawData['authorId'];
    }

}