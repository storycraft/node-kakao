import { StructBase } from "./struct-base";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";
import { OpenLinkType, OpenMemberType } from "../open/open-link-type";
import { Converter, ObjectMapper } from "json-proxy-mapper";

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

    export const ConvertMap = {

        userId: JsonUtil.LongConverter,
        linkId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}

export interface OpenLinkStruct extends StructBase {

    linkId: Long;
    openToken: number;
    linkName: string;
    linkURL: string;
    linkType: OpenLinkType;
    owner: OpenMemberStruct;
    description: string;
    coverURL: string;

}

export namespace OpenLinkStruct {

    export const Mappings = {

        linkId: 'li',
        openToken: 'otk',
        linkName: 'ln',
        linkType: 'lt',
        owner: 'olu',
        description: 'desc',
        coverURL: 'liu'

    }

    export const ConvertMap = {

        linkId: JsonUtil.LongConverter,
        logId: new Converter.Object(OpenMemberStruct.Mappings, OpenMemberStruct.ConvertMap)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}