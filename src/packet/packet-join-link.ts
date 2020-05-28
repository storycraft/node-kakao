/*
 * Created on Mon May 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long, OpenchatProfileType } from "..";
import { MemberStruct } from "../talk/struct/member-struct";
import { OpenLinkStruct, OpenMemberStruct } from "../talk/struct/open-link-struct";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketJoinLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public Referer: string = '',
        public ChannelKey: string = '',
        
        public ProfileType: OpenchatProfileType = OpenchatProfileType.MAIN,

        public Nickname: string = '',           // KAKAO_ANON
        public ProfilePath: string = '', 

        public ProfileLinkId: Long = Long.ZERO  // OPEN_PROFILE
    ) {
        super();
    }

    get PacketName() {
        return 'JOINLINK';
    }

    toBodyJson() {
        let obj: any = {
            'li': this.LinkId,
            'ref': this.Referer,
            'tk': this.ChannelKey,
            'ptp': this.ProfileType
        };

        if (this.ProfileType === OpenchatProfileType.KAKAO_ANON) {
            if (this.Nickname !== '') obj['nn'] = this.Nickname;

            if (this.ProfilePath !== '') obj['pp'] = this.ProfilePath;
        } else if (this.ProfileType === OpenchatProfileType.OPEN_PROFILE) {
            obj['pli'] = this.ProfileLinkId;
        }

        return obj;
    }

}

export class PacketJoinLinkRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkInfo?: OpenLinkStruct,
        public OpenMember?: OpenMemberStruct,
        public ChatInfo?: ChatInfoStruct,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'JOINLINK';
    }

    readBodyJson(rawData: any) {
        if (rawData['ol']) this.LinkInfo = Serializer.deserialize<OpenLinkStruct>(rawData['ol'], OpenLinkStruct.MAPPER);
        if (rawData['olu']) this.OpenMember = Serializer.deserialize<OpenMemberStruct>(rawData['olu'], OpenMemberStruct.MAPPER);
        if (rawData['chatRoom']) this.ChatInfo = Serializer.deserialize<ChatInfoStruct>(rawData['chatRoom'], ChatInfoStruct.MAPPER);
        if (rawData['chatLog']) this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
    }

}