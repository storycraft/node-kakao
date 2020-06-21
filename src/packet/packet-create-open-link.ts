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
import { OpenLinkProfileContent } from "../talk/open/open-link-profile-template";

/*
 *  TODO:
 *    - How to make 'lip'?
 */

export class PacketCreateOpenLinkReq extends LocoBsonRequestPacket {

    constructor(
        public Name: string = '',
        public LinkImagePath: string = '',
        public LinkType: OpenLinkType = OpenLinkType.PROFILE,
        public Description: string = '',
        public ProfileContent: OpenLinkProfileContent | null = null,

        public AllowAnonProfile: boolean = true,
        public CanSearchLink: boolean = true,

        public CreatedTime: Long = Long.ZERO,
        public Activated: boolean = true,
        public ChannelLimit: number = 0,
        
        public ProfileType: OpenProfileType = OpenProfileType.MAIN,

        public Nickname: string = '',           // KAKAO_ANON
        public ProfilePath: string = '', 
        public ProfileLinkId: Long = Long.ZERO,  // OPEN_PROFILE
        public UserLimit: number = 0
        
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
            'aptp': this.AllowAnonProfile,
            'sc': this.CanSearchLink,
            'ri': this.CreatedTime,
            'pa': this.Activated,
        };

        if (this.LinkType === OpenLinkType.PROFILE) obj['dcl'] = this.ChannelLimit;
        else if (this.LinkType === OpenLinkType.CHANNEL) obj['ml'] = this.UserLimit;

        obj['ptp'] = this.ProfileType;
        switch ( this.ProfileType ) {

            case OpenProfileType.KAKAO_ANON:
                obj['nn'] = this.Nickname;
                obj['pp'] = this.ProfilePath;
                break;

            case OpenProfileType.OPEN_PROFILE:
                obj['pli'] = this.ProfileLinkId;
                break;

            default: break;

        }

        obj['desc'] = this.Description;
        if (this.ProfileContent) obj['pfc'] = this.ProfileContent;

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
