/*
 * Created on Tue Jun 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenProfileType, OpenChannelType, OpenLinkType } from "../talk/open/open-link-type";
import { ChannelInfoStruct } from "../talk/struct/channel-info-struct";
import { Serializer } from "json-proxy-mapper";
import { OpenLinkStruct } from "../talk/struct/open/open-link-struct";

/*
 *  TODO:
 *    - What is 'pa'?
 *    - What is 'ri'?
 *    - How to make 'lip'?
 */

export class PacketCreateOpenLinkReq extends LocoBsonRequestPacket {

    constructor(
        public Name: string = '',
        public LinkImagePath: string = '',
        public LinkType: OpenLinkType = OpenLinkType.PROFILE,
        public ProfileType: OpenProfileType = OpenProfileType.MAIN,
        public Description: (string | any) = null,

        public Nickname: string = '',           // KAKAO_ANON
        public ProfilePath: string = '', 

        public ProfileLinkId: Long = Long.ZERO,
        public LimitProfileType: boolean = true,
        public CanSearchLink: boolean = true,

        public UNKNOWN1: number = Math.floor(Date.now() / 1000),
        public UNKNOWN2: boolean = true,
    ) {
        super();
    }

    get PacketName() {
        return 'CREATELINK';
    }

    toBodyJson() {
        const obj: any = {
            'ln': this.Name,
            'lip': this.LinkImagePath,
            'lt': this.LinkType,
            'ptp': this.ProfileType,
            'aptp': this.LimitProfileType,
            'sc': this.CanSearchLink,
            'ri': this.UNKNOWN1,
            'pa': this.UNKNOWN2,
        };

        switch ( this.ProfileType ) {

            case OpenProfileType.KAKAO_ANON:
                obj['nn'] = this.Nickname;
                obj['pp'] = this.ProfilePath;
                break;

            case OpenProfileType.OPEN_PROFILE:
                obj['pli'] = this.ProfileLinkId;
                break;

        }

        if ( this.Description ) obj['desc'] = this.Description;

        return obj;
    }

}

export class PacketCreateOpenLinkRes extends LocoBsonResponsePacket {
    constructor(
        status: number,
        public OpenLink?: OpenLinkStruct,
        public ChatInfo?: ChannelInfoStruct,
    ) {
        super(status);
    }

    get PacketName() {
        return 'CREATELINK';
    }

    readBodyJson(rawData: any) {
        if (rawData['ol']) this.OpenLink = Serializer.deserialize<OpenLinkStruct>(rawData['ol'], OpenLinkStruct.MAPPER);
        
        if (rawData['chatRoom']) this.ChatInfo = Serializer.deserialize<ChannelInfoStruct>(rawData['chatRoom'], ChannelInfoStruct.MAPPER);
    }

}
