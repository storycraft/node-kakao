/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { LoginData } from '..';

/**
 * Raw login data
 */
export interface AccessDataStruct {

    userId: number | Long;

    countryIso: string;
    countryCode: string;

    accountId: number;

    server_time: number;

    resetUserData: boolean;

    story_url: string;

    access_token: string;
    refresh_token: string;
    token_type: string;

    autoLoginAccountId: string;
    displayAccountId: string;

    mainDeviceAgentName: string;
    mainDeviceAppVersion: string;
}

export function structToLoginData(struct: AccessDataStruct, deviceUUID: string): LoginData {
  return {
    userId: struct.userId,

    countryIso: struct.countryIso,
    countryCode: struct.countryCode,

    accountId: struct.accountId,

    serverTime: struct.server_time,

    resetUserData: struct.resetUserData,

    storyURL: struct.story_url,

    accessToken: struct.access_token,
    refreshToken: struct.refresh_token,

    deviceUUID: deviceUUID,

    tokenType: struct.token_type,

    autoLoginAccountId: struct.autoLoginAccountId,
    displayAccountId: struct.displayAccountId,

    mainDeviceAgentName: struct.mainDeviceAgentName,
    mainDeviceAppVersion: struct.mainDeviceAppVersion,
  };
}
