/*
 * Created on Tue Jun 09 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { LocoBsonRequestPacket } from "../loco-bson-packet";

export abstract class MediaRequestBasePacket extends LocoBsonRequestPacket {

    constructor(
        public UserId: Long = Long.ZERO,
        public Os: string = '',
        public Version: string = '',
        public NetworkType: number = 0,
        public NetworkMccMnc: string = '',

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