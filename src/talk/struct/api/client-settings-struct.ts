import { Long } from "bson";
import { NameMapping, ObjectMapper, ConvertMap } from "json-proxy-mapper";
import { ApiStruct, ApiStatusCode } from "./api-struct";
import { JsonUtil } from "../../../util/json-util";
import { StructBase } from "../struct-base";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ClientConfigStruct extends StructBase {

    osVersion: string;

}

export interface MoreAppsStruct extends StructBase {

    recommend: any[];
    all: any[];

}

export interface ShortcutStruct extends StructBase {
    
    [menu: string]: number;

}

export interface OpenChatSettingsStruct extends StructBase {

    chatMemberMaxJoin: number;
    chatRoomMaxJoin: number;
    createLinkLimit: 10;
    createCardLinkLimit: 3;
    numOfStaffLimit: 5;
    rewritable: boolean;
    handoverEnabled: boolean;

}

export interface ClientSettingsStruct extends ApiStruct {

    status: ApiStatusCode;
    since: number;

    clientConf: ClientConfigStruct;

    available: number;
    available2: number;

    friendsPollingInterval: number;
    settingsPollingInterval: number;
    profilePollingInterval: number;
    moreListPollingInterval: number;
    morePayPollingInterval: number;
    daumMediaPollingInterval: number;
    lessSettingsPollingInterval: number;

    moreApps: MoreAppsStruct;
    shortcuts: ShortcutStruct[],

    seasonProfileRev: number,
    seasonNoticeRev: number,

    serviceUserId: number,

    accountId: number;
    accountDisplayId: string;
    hashedAccountId: string;

    pstnNumber: string;
    formattedPstnNumber: string;
    nsnNumber: string;
    formattedNsnNumber: string;

    contactNameSync: number,

    allowMigration: boolean;

    emailStatus: number;
    emailAddress: string;
    emailVerified: boolean;

    uuid: string;
    uuidSearchable: boolean;
    nickName: string;

    openChat: OpenChatSettingsStruct;

    profileImageUrl: string;
    fullProfileImageUrl: string;
    originalProfileImageUrl: string;

    statusMessage: string;

}