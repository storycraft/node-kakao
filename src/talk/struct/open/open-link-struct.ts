import { StructBase } from "../struct-base";
import { Long } from "bson";
import { OpenLinkType, OpenMemberType, OpenProfileType } from "../../open/open-link-type";
import { Converter, ObjectMapper } from "json-proxy-mapper";
import { OpenLinkSettings } from "../../open/open-link-settings";
import { BaseMemberStruct } from "../member-struct";

/*
 * Created on Fri Nov 22 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface CommonOpenMemberStruct {

    memberType: OpenMemberType;
    profileType: OpenProfileType;

    linkId?: Long;
    openToken: number;
    
}

export interface OpenKickedMemberStruct extends BaseMemberStruct {
    
    kickedChannelId: Long;
    dc: boolean;

}

export namespace OpenKickedMemberStruct {

    export const Mappings = {

        userId: 'userId',
        nickname: 'nickName',
        profileImageUrl: 'pi',
        kickedChannelId: 'c',
        dc: 'dc'

    }

    export const MAPPER = new ObjectMapper(Mappings);
    
}

export interface OpenMemberStruct extends BaseMemberStruct, CommonOpenMemberStruct {
    
}

export namespace OpenMemberStruct {

    export const Mappings = {

        userId: 'userId',
        nickname: 'nickName',
        profileImageUrl: 'pi',
        originalProfileImageUrl: 'opi',
        fullProfileImageUrl: 'fpi',
        profileType: 'ptp',
        openToken: 'opt',

        linkId: 'pli',
        memberType: 'mt'

    }

    export const MAPPER = new ObjectMapper(Mappings);
    
}

export interface OpenLinkMemberStruct extends OpenMemberStruct {

    linkId: Long;
    pv: Long;

}

export namespace OpenLinkMemberStruct {

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

export enum OpenLinkTagType {

    DESCRIPTION = 1,
    HASH_TAG = 2

}

export interface OpenLinkTag {

    type: OpenLinkTagType; 
    content: string;

}

export namespace OpenLinkTag {

    export const Mappings = {

        type: 't',
        content: 'c'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface OpenLinkTagList {

    tags: OpenLinkTag[];

}

export namespace OpenLinkTagList {

    export const Mappings = {

        tags: 'tags'

    }

    export const ConvertMap = {
        
        tags: new Converter.Array(OpenLinkTag.Mappings)

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

    tagList: { tags?: OpenLinkTag[] };

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
        
        canSearchLink: 'sc',

        tagList: 'omt'

    }

    export const ConvertMap = {

        owner: new Converter.Object(OpenLinkMemberStruct.Mappings),
        tagList: new Converter.Object(OpenLinkTagList.Mappings, OpenLinkTagList.ConvertMap)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}

export interface OpenLinkReactionInfo {

    reactionCount: number;
    reacted: boolean;

}