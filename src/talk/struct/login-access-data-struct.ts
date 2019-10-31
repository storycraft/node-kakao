import { StructBase } from "./struct-base";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LoginAccessDataStruct implements StructBase {

    constructor(
        public Status: number = 0,
        public StoryURL: string = '',
        public UserId: number = 0,
        public CountryISO: string = '',
        public CountryCode: string = '0',
        public AccountId: number = 0,
        public LogonServerTime: number = 0,
        public ResetUserData: boolean = false,
        public AccessToken: string = '',
        public RefreshToken: string = '',
        public TokenType: string = '',
        public AutoLoginEmail: string = '',
        public DisplayAccountId: string = '',
        public MainDevice: string = '',
        public MainDeviceAppVersion: string = '',
    ) {

    }

    fromJson(data: any) {
        this.Status = data['status'];
        this.StoryURL = data['story_url'];
        this.UserId = data['userId'],
        this.CountryISO = data['countryIso'],
        this.CountryCode = data['countryCode'],
        this.AccountId = data['accountId'],
        this.LogonServerTime = data['server_time'],
        this.ResetUserData = data['resetUserData'],
        this.AccessToken = data['access_token'],
        this.RefreshToken = data['refresh_token'],
        this.TokenType = data['token_type'],
        this.AutoLoginEmail = data['autoLoginAccountId'],
        this.DisplayAccountId = data['displayAccountId'],
        this.MainDevice = data['mainDeviceAgentName'],
        this.MainDeviceAppVersion = data['mainDeviceAppVersion']
    }

    toJson() {
        return {
            'status': this.Status,
            'story_url': this.StoryURL,
            'userId': this.UserId,
            'countryIso': this.CountryISO,
            'countryCode': this.CountryCode,
            'accountId': this.AccountId,
            'server_time': this.LogonServerTime,
            'resetUserData': this.ResetUserData,
            'access_token': this.AccessToken,
            'refresh_token': this.RefreshToken,
            'token_type': this.TokenType,
            'autoLoginAccountId': this.AutoLoginEmail,
            'displayAccountId': this.DisplayAccountId,
            'mainDeviceAgentName': this.MainDevice,
            'mainDeviceAppVersion': this.MainDeviceAppVersion
        };
    }

}