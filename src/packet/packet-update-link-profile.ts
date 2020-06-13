/*
 * Created on Mon May 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { OpenMemberStruct } from "../talk/struct/open/open-link-struct";
import { OpenProfileType } from "../talk/open/open-link-type";
import { Serializer } from "json-proxy-mapper";

export class PacketUpdateLinkProfileReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ProfileType: OpenProfileType = OpenProfileType.MAIN,

        public Nickname: string = '',           // KAKAO_ANON
        public ProfilePath: string = '', 

        public ProfileLinkId: Long = Long.ZERO  // OPEN_PROFILE
    ) {
        super();
    }

    get PacketName() {
        return 'UPLINKPROF';
    }
    
    toBodyJson() {
        let obj: any = {
            'li': this.LinkId,
            'ptp': this.ProfileType
        };

        if (this.ProfileType === OpenProfileType.KAKAO_ANON) {

            if (this.Nickname !== '') obj['nn'] = this.Nickname;
            if (this.ProfilePath !== '') obj['pp'] = this.ProfilePath;
            
        } else if (this.ProfileType === OpenProfileType.OPEN_PROFILE) {
            obj['pli'] = this.ProfileLinkId;
        }

        return obj;
    }
}

export class PacketUpdateLinkProfileRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public UpdatedProfile?: OpenMemberStruct
    ) {
        super(status);
    }

    get PacketName() {
        return 'UPLINKPROF';
    }

    readBodyJson(rawData: any) {
        if (rawData['olu']) {
            this.UpdatedProfile = Serializer.deserialize<OpenMemberStruct>(rawData['olu'], OpenMemberStruct.MAPPER);
        }
    }

}