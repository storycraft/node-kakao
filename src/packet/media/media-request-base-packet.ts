/*
 * Created on Tue Jun 09 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket } from "../loco-bson-packet";
import { KakaoAPI } from "../../kakao-api";
import { Long } from "bson";

export abstract class MediaRequestBasePacket extends LocoBsonRequestPacket {

    constructor(
        public UserId: Long = Long.ZERO,
        public Os: string = KakaoAPI.Agent,
        public Version: string = KakaoAPI.Version,
        public NetworkType: number = 0,
        public NetworkMccMnc: string = '999',

    ) {
        super();
    }

    abstract get PacketName(): string;

    toBodyJson() {
        return {
            'u': this.UserId,
            'os': this.Os,
            'av': this.Version,
            'nt': this.NetworkType,
            'mm': this.NetworkMccMnc
        };
    }

}