/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "../loco-bson-packet";
import { Long } from "bson";
import { KakaoAPI } from "../../kakao-api";
import { ChatType } from "../../talk/chat/chat-type";
import { JsonUtil } from "../../util/json-util";

export class PacketPostReq extends LocoBsonRequestPacket {
    
    constructor(
        public Key: string = '',
        public Size: Long = Long.ZERO,
        public Name: string = '',
        public Width: number = 0,
        public Height: number = 0,

        public ChannelId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Unknown,
        public MessageId: Long = Long.ZERO,
        public NoSeen: boolean = false,

        public UserId: Long = Long.ZERO,
        public Os: string = KakaoAPI.Agent,
        public Version: string = KakaoAPI.Version,
        public NetworkType: number = 0,
        public NetworkMccMnc: string = '999',

    ) {
        super();
    }

    get PacketName() {
        return 'POST';
    }

    toBodyJson() {
        let obj: any = {
            'k': this.Key,
            's': this.Size,
            'f': this.Name,
            'w': this.Width,
            'h': this.Height,

            'c': this.ChannelId,
            't': this.Type,
            'mid': this.MessageId,
            'ns': this.NoSeen,

            'u': this.UserId,
            'os': this.Os,
            'av': this.Version,
            'nt': this.NetworkType,
            'mm': this.NetworkMccMnc
        };

        return obj;
    }

}

export class PacketPostRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Offset: Long = Long.ZERO
    ) {
        super(status);
    }

    get PacketName() {
        return 'POST';
    }

    readBodyJson(rawData: any) {
        this.Offset = JsonUtil.readLong(rawData['o']);
    }

}