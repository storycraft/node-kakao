/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChannelPrivateMetaType } from "../talk/struct/channel-meta-struct";
import { Long } from "bson";

export class PacketSetPrivateMetaReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChannelPrivateMetaType = ChannelPrivateMetaType.UNDEFINED,
        public Content: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'SETMCMETA';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'type': this.Type,
            'content': this.Content
        };
    }

}

export class PacketSetPrivateMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Type: ChannelPrivateMetaType = ChannelPrivateMetaType.UNDEFINED,
        public Revision: string = '',
        public ImageURL: string = '',
        public FullImageURL: string = '',
        public Content: string = ''

    ) {
        super(status);
    }

    get PacketName() {
        return 'SETMCMETA';
    }

    readBodyJson(rawData: any) {
        // TODO::
    }

}