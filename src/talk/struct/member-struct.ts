import { StructBase } from "./struct-base";
import { UserType } from "../user/user-type";
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
        statusMessage: 'statusMessage'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}