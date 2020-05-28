import { StructBaseOld, StructBase } from "./struct-base";
import { UserType } from "../user/user-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { OpenMemberType } from "../open/open-link-type";
import { ObjectMapper } from "json-proxy-mapper";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MemberStruct extends StructBase {

    userId: Long;
    nickname: string;
    profileImageUrl: string;
    originalProfileImageUrl: string;
    fullProfileImageUrl: string;
    type: UserType;
    accountId: number;
    linkedService: string;
    statusMessage: string;

    openProfileImageUrl?: string;
    openOriginalProfileImageUrl?: string;
    openFullProfileImageUrl?: string;
    openMemberType?: OpenMemberType;
    openLinkId?: Long,
    openToken?: number;

}

export namespace MemberStruct {

    export const Mappings = {

        userId: 'userId',
        nickname: 'nickName',
        profileImageUrl: 'profileImageUrl',
        fullProfileImageUrl: 'fullProfileImageUrl',
        originalProfileImageUrl: 'originalProfileImageUrl',
        type: 'type',
        accountId: 'accountId',
        linkedService: 'linkedService',
        statusMessage: 'statusMessage',

        openProfileImageUrl: 'pi',
        openOriginalProfileImageUrl: 'opi',
        openFullProfileImageUrl: 'fpi',
        openMemberType: 'mt',
        openLinkId: 'li',
        openToken: 'opt'

    }

    export const ConvertMap = {

        userId: JsonUtil.LongConverter,
        openLinkId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}