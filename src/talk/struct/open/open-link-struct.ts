import { StructBase } from "../struct-base";
import { Long } from "bson";
import { OpenLinkType, OpenMemberType, OpenProfileType } from "../../open/open-link-type";
import { Converter, ObjectMapper } from "json-proxy-mapper";
import { OpenLinkSettings } from "../../open/open-link-settings";

/*
 * Created on Fri Nov 22 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface OpenMemberStruct {

    userId: Long;
    nickname: string;
    profileImageUrl: string;
    originalProfileImageUrl: string;
    fullProfileImageUrl: string;

    memberType: OpenMemberType;
    profileType: OpenProfileType;

    linkId: Long;
    openToken: number;

    pv: Long;

}

export namespace OpenMemberStruct {

    export const Mappings = {

        userId: 'userId',
        nickname: 'nn',
        profileImageUrl: 'pi',
        originalProfileImageUrl: 'opi',
        fullProfileImageUrl: 'fpi',
        memberType: 'lmt',
        profileType: 'ptp',
        linkId: 'li',
        openToken: 'opt',
        pv: 'pv'

    }

    export const MAPPER = new ObjectMapper(Mappings);
    
}

export interface OpenLinkStruct extends StructBase {

    linkId: Long;
    openToken: number;

    linkName: string;
    linkURL: string;
    linkType: OpenLinkType;

    createdAt: number,

    maxUserLimit?: number;
    maxChannelLimit?: number;

    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;

    activated: boolean;
    UNKNOWN2: true;

    description: string;

    linkCoverURL: string;

    owner: OpenMemberStruct;

}

export namespace OpenLinkStruct {

    export const Mappings = {

        linkId: 'li',
        openToken: 'otk',

        linkName: 'ln',
        linkType: 'lt',
        linkURL: 'lu',
        linkCoverURL: 'liu',

        createdAt: 'ca',

        maxUserLimit: 'ml',
        maxChannelLimit: 'dcl',
        activated: 'ac',
        UNKNOWN2: 'pa',

        passcode: 'pc',
        owner: 'olu',
        description: 'desc',
        
        canSearchLink: 'sc'

    }

    export const ConvertMap = {

        owner: new Converter.Object(OpenMemberStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}