/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChannelClientMetaType } from "../talk/struct/channel-meta-struct";
import { Long } from "bson";

export class PacketSetClientMetaReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChannelClientMetaType = ChannelClientMetaType.UNDEFINED,
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

export class PacketSetClientMetaRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Type: ChannelClientMetaType = ChannelClientMetaType.UNDEFINED,
        public Revision: number = 0,
        public ImageURL?: string,
        public FullImageURL?: string,
        public Content?: string

    ) {
        super(status);
    }

    get PacketName() {
        return 'SETMCMETA';
    }

    readBodyJson(rawData: any) {
        this.Type = rawData['type'];
        this.Revision = rawData['revision'];

        if (rawData['imageUrl']) this.ImageURL = rawData['imageUrl'];
        if (rawData['fullImageUrl']) this.FullImageURL = rawData['fullImageUrl'];
        if (rawData['content']) this.Content = rawData['content'];
    }

}