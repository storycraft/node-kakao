/*
 * Created on Tue Jun 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenchatProfileType, OpenChannelType } from "../talk/open/open-link-type";
import { KakaoAnonProfile } from "../talk/open/open-chat-profile";

/*
 *  TODO:
 *    - What is 'pa'?
 *    - What is 'ri'?
 *    - How to make 'lip'?
 */

export class PacketCreateOpenChannelReq extends LocoBsonRequestPacket {


    constructor(
        public title: string = '',
        public linkImagePath: string = '',
        public linkType: OpenChannelType = OpenChannelType.GROUP,
        public profileType: OpenchatProfileType = OpenchatProfileType.MAIN,
        public description: (string | any) = null,
        public openProfile: (KakaoAnonProfile | any) = null,
        public profileId: (number | any) = null,
        public limitProfileType: boolean = true,
        public canSearchLink: boolean = true,
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
            'ln': this.title,
            'lip': this.linkImagePath,
            'lt': this.linkType,
            'ptp': this.profileType,
            'aptp': this.limitProfileType,
            'sc': this.canSearchLink,
            'ri': this.UNKNOWN1,
            'pa': this.UNKNOWN2,
        };

        switch ( this.profileType ) {
            case OpenchatProfileType.KAKAO_ANON:
                obj['nn'] = this.openProfile.nickname;
                obj['pp'] = this.openProfile.profilePath;
                break;
            case OpenchatProfileType.OPEN_PROFILE:
                obj['pli'] = this.profileId;
                break;
        }

        if ( this.description ) {
            obj['desc'] = this.description;
        }

        return obj;
    }

}

export class PacketCreateOpenChannelRes extends LocoBsonResponsePacket {
    constructor(
        status: number,
        public ol: any = null,
        public chatRoom: any = null,
    ) {
        super(status);
    }

    get PacketName() {
        return 'CREATELINK';
    }

    readBodyJson(rawData: any) {
        this.ol = rawData['ol'];
        this.chatRoom = rawData['chatRoom'];
    }

}
