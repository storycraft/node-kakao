/*
 * Created on Mon May 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "..";
import { MemberStruct } from "../talk/struct/member-struct";
import { OpenLinkStruct } from "../talk/struct/open-link-struct";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

export class PacketJoinLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public Ref: string = '',
        public ChannelKey: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'JOINLINK';
    }

    toBodyJson() {
        return {
            'li': this.LinkId,
            'ref': this.Ref,
            'tk': this.ChannelKey
        }
    }

}

export class PacketJoinLinkRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkInfo: OpenLinkStruct = new OpenLinkStruct(),
        public OpenMember: MemberStruct = new MemberStruct(),
        public ChatInfo: ChatInfoStruct = new ChatInfoStruct(),
        public Chatlog: ChatlogStruct = new ChatlogStruct()
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'JOINLINK';
    }

    readBodyJson(rawData: any) {
        if (rawData['ol']) this.LinkInfo.fromJson(rawData['ol']);
        if (rawData['olu']) this.OpenMember.fromJson(rawData['olu']);
        if (rawData['chatRoom']) this.ChatInfo.fromJson(rawData['chatRoom']);
        if (rawData['chatLog']) this.Chatlog.fromJson(rawData['chatLog']);
    }

}