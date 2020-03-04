import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { JsonUtil } from "../util/json-util";

/*
 * Created on Wed Mar 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketSyncJoinOpenchatRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public OpenId: Long = Long.ZERO,
        public ChatInfo : ChatInfoStruct | null = null
    ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCLINKCR';
    }

    readBodyJson(rawBody: any) {
        this.OpenId = JsonUtil.readLong(rawBody['ol']);

        if (rawBody['chatRoom']) {
            this.ChatInfo = new ChatInfoStruct();
            this.ChatInfo.fromJson(rawBody['chatRoom']);
        } else {
            this.ChatInfo = null;
        }
    }

}