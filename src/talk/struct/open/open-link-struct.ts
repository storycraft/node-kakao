import { StructBase } from "../struct-base";
import { Long } from "bson";
import { OpenLinkType, OpenMemberType } from "../../open/open-link-type";
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
    linkId: Long,
    openToken: number;

}

export namespace OpenMemberStruct {

    export const Mappings = {

        userId: 'userId',
        nickname: 'nn',
        profileImageUrl: 'pi',
        originalProfileImageUrl: 'opi',
        fullProfileImageUrl: 'fpi',
        memberType: 'lmt',
        linkId: 'li',
        openToken: 'opt'

    }

    export const MAPPER = new ObjectMapper(Mappings);
    
}

export interface OpenLinkStruct extends OpenLinkSettings, StructBase {

    linkName: string;

    maxUser: number;
    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;
    UNKNOWN1: boolean;
    UNKNOWN2: boolean;

    description: string;

    coverURL: string;

    linkId: Long;
    openToken: number;
    
    linkURL: string;
    linkType: OpenLinkType;

    owner: OpenMemberStruct;

}

export namespace OpenLinkStruct {

    export const Mappings = {

        linkId: 'li',
        openToken: 'otk',

        linkName: 'ln',
        linkType: 'lt',

        maxUser: 'ml',
        UNKNOWN1: 'ac',
        UNKNOWN2: 'pa',

        passcode: 'pc',
        owner: 'olu',
        description: 'desc',
        coverURL: 'liu',
        
        canSearchLink: 'sc'

    }

    export const ConvertMap = {

        logId: new Converter.Object(OpenMemberStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}