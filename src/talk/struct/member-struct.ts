import { StructBase } from "./struct-base";
import { UserType } from "../user/user-type";
import { Long } from "bson";
import { ObjectMapper } from "json-proxy-mapper";
import { CommonOpenMemberStruct } from "./open/open-link-struct";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface BaseMemberStruct extends StructBase {
    
    type: UserType;
    userId: Long;
    nickname: string;
    profileImageUrl: string;
    originalProfileImageUrl: string;
    fullProfileImageUrl: string;

}

export interface MemberStruct extends BaseMemberStruct {

    accountId: number;
    linkedService: string;
    statusMessage: string;

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

        openToken: 'opt',
        memberType: 'lmt',
        profileType: 'ptp',
        linkId: 'li',
        pv: 'pv'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}