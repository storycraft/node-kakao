/*
 * Created on Sun Jun 14 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenKickedMemberStruct } from "../talk/struct/open/open-link-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketKickListSyncReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'KLSYNC';
    }

    toBodyJson() {
        return { li: this.LinkId };
    }

}

export class PacketKickListSyncRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public KickedMemberList: OpenKickedMemberStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'KLSYNC';
    }

    readBodyJson(rawData: any) {

        this.KickedMemberList = [];
        if (rawData['kickMembers']) {
            for (let rawKickedMem of rawData['kickMembers']) {
                this.KickedMemberList.push(Serializer.deserialize<OpenKickedMemberStruct>(rawKickedMem, OpenKickedMemberStruct.MAPPER));
            }
        }

    }

}