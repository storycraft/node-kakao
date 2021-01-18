import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Sat Dec 28 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketKickMemberReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public MemberId: Long = Long.ZERO,
    ) {
        super();
    }

    get PacketName(): string {
        return 'KICKMEM';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.LinkId,
            'c': this.ChannelId,
            'mid': this.MemberId,
        };

        return obj;
    }
}

export class PacketKickMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public MemberId: Long = Long.ZERO,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }

    get PacketName(): string {
        return 'KICKMEM';
    }

    readBodyJson(body: any): void {
        this.ChannelId = JsonUtil.readLong(body['chatId']);
        this.MemberId = JsonUtil.readLong(body['kid']);
        
        if (body['chatLog']) this.Chatlog = Serializer.deserialize<ChatlogStruct>(body['chatLog'], ChatlogStruct.MAPPER);
    }
}