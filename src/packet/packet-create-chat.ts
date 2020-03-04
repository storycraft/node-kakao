import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { JsonUtil } from "../util/json-util";

/*
 * Created on Wed Mar 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketCreateChatReq extends LocoBsonRequestPacket {

    constructor(public UserIdList: Long[] = []) {
        super();
    }

    get PacketName() {
        return 'CREATE';
    }

    toBodyJson(): any {
        return {
            'memberIds': this.UserIdList
        }
    }

}

export class PacketCreateChatRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public readonly ChatInfo: ChatInfoStruct = new ChatInfoStruct()
        ) {
            super(status);
    }

    get PacketName() {
        return 'CREATE';
    }
    
    readBodyJson(rawBody: any) {
        this.ChannelId = JsonUtil.readLong(rawBody['c']);
        this.ChatInfo.fromJson(rawBody['chatRoom']);
    }

}