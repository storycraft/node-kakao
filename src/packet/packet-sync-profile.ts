/*
 * Created on Thu May 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenLinkMemberStruct } from "../talk/struct/open/open-link-struct";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

export class PacketSyncProfileRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public LinkId: Long = Long.ZERO,
        public OpenMember?: OpenLinkMemberStruct
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
            this.OpenMember = Serializer.deserialize<OpenLinkMemberStruct>(rawData['olu'], OpenLinkMemberStruct.MAPPER);
        }
    }

}