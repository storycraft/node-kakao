/*
 * Created on Mon May 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long, OpenProfileType } from "..";
import { OpenLinkStruct, OpenMemberStruct, OpenLinkMemberStruct } from "../talk/struct/open/open-link-struct";
import { ChannelInfoStruct } from "../talk/struct/channel-info-struct";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { Serializer } from "json-proxy-mapper";

export class PacketJoinLinkReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public Referer: string = '',
        public JoinToken: string = '',
        
        public ProfileType: OpenProfileType = OpenProfileType.MAIN,

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
            'ptp': this.ProfileType
        };

        if (this.JoinToken) obj['tk'] = this.JoinToken;

        if (this.ProfileType === OpenProfileType.KAKAO_ANON) {
            if (this.Nickname !== '') obj['nn'] = this.Nickname;

            if (this.ProfilePath !== '') obj['pp'] = this.ProfilePath;
        } else if (this.ProfileType === OpenProfileType.OPEN_PROFILE) {
            obj['pli'] = this.ProfileLinkId;
        }

        return obj;
    }

}

export class PacketJoinLinkRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public LinkInfo?: OpenLinkStruct,
        public OpenMember?: OpenLinkMemberStruct,
        public ChatInfo?: ChannelInfoStruct,
        public Chatlog?: ChatlogStruct
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'JOINLINK';
    }

    readBodyJson(rawData: any) {
        if (rawData['ol']) this.LinkInfo = Serializer.deserialize<OpenLinkStruct>(rawData['ol'], OpenLinkStruct.MAPPER);
        if (rawData['olu']) this.OpenMember = Serializer.deserialize<OpenLinkMemberStruct>(rawData['olu'], OpenLinkMemberStruct.MAPPER);
        if (rawData['chatRoom']) this.ChatInfo = Serializer.deserialize<ChannelInfoStruct>(rawData['chatRoom'], ChannelInfoStruct.MAPPER);
        if (rawData['chatLog']) this.Chatlog = Serializer.deserialize<ChatlogStruct>(rawData['chatLog'], ChatlogStruct.MAPPER);
    }

}