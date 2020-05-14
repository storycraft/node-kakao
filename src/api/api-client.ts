/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as request from "request-promise";

import { KakaoAPI } from "../kakao-api";

export class ApiClient {

    constructor(
        private deviceUUID: string,
        private accessToken: string
    ) {

    }

    protected getAuthKey(): string {
        return `${this.accessToken}-${this.deviceUUID}`;
    }

    protected getSessionHeader() {
        return {
            'Host': KakaoAPI.InternalHost,
            'Authorization': this.getAuthKey(),
            'A': KakaoAPI.AuthHeaderAgent,
            'User-Agent': KakaoAPI.AuthUserAgent,
            'Accept': '*/*',
            'Accept-Language': KakaoAPI.Language
        };
    }

    async requestAccountSettings(accessToken: string, deviceUUID: string, since: number = 0, language: string = KakaoAPI.Language) {
        return this.createApiRequest(`${KakaoAPI.getInternalURL(KakaoAPI.LogonAccount.MORE_SETTINGS)}?since=${since}&lang=${language}`);
    }

    async requestAutoLoginToken(accessToken: string, deviceUUID: string) {
        return this.createApiRequest(`${KakaoAPI.getInternalURL(KakaoAPI.LogonAccount.LOGIN_TOKEN)}`);
    }

    protected createApiRequest<T>(url: string): request.RequestPromise {
        return request({
            url: `${KakaoAPI.getInternalURL(KakaoAPI.LogonAccount.LOGIN_TOKEN)}`,
            headers: this.getSessionHeader(),
            method: 'GET'
        }) as request.RequestPromise;
    }

}