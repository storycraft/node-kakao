import { Long } from "bson";
import { JsonUtil } from "../../../util/json-util";
import { NameMapping, ConvertMap, ObjectMapper } from "json-proxy-mapper";
import { AuthApiStruct } from "./auth-api-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LoginAccessDataStruct extends AuthApiStruct {

    message: string,
    userId: Long,
    countryISO: string,
    countryCode: string,
    accountId: number,
    logonServerTime: number,
    resetUserData: boolean,
    accessToken: string,
    refreshToken: string,
    tokenType: string,
    autoLoginEmail: string,
    displayAccountId: string,
    mainDevice: string,
    mainDeviceAppVersion: string,

}

export namespace LoginAccessDataStruct {

    let mappings: NameMapping = {

        status: 'status',
        message: 'message',
        userId: 'userId',
        countryISO: 'countryIso',
        countryCode: 'countryCode',
        accountId: 'accountId',
        logonServerTime: 'server_time',
        resetUserData: 'resetUserData',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        tokenType: 'token_type',
        autoLoginEmail: 'autoLoginAccountId',
        displayAccountId: 'displayAccountId',
        mainDevice: 'mainDeviceAgentName',
        mainDeviceAppVersion: 'mainDeviceAppVersion'
    
    }
    
    let convertMap: ConvertMap = {
    
        userId: JsonUtil.LongConverter
    
    }

    export const MAPPER = new ObjectMapper(mappings, convertMap);

}