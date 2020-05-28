/*
 * Created on Thu May 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenMemberStruct } from "../talk/struct/open-link-struct";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

export class PacketSyncProfileRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public LinkId: Long = Long.ZERO,
        public OpenMember?: OpenMemberStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'SYNCLINKPF';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        this.LinkId = JsonUtil.readLong(rawData['li']);
        
        if (rawData['olu']) {
            this.OpenMember = Serializer.deserialize<OpenMemberStruct>(rawData['olu'], OpenMemberStruct.MAPPER);
        }
    }

}