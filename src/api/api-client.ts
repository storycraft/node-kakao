/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as request from "request-promise";

import { KakaoAPI } from "../kakao-api";
import { JsonUtil } from "../util/json-util";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { ClientSettingsStruct } from "../talk/struct/api/client-settings-struct";
import { StructBase } from "../talk/struct/struct-base";

export class ApiClient {

    constructor(
        private deviceUUID: string,
        private provider: AccessDataProvider
    ) {

    }

    get DeviceUUID() {
        return this.deviceUUID;
    }

    set DeviceUUID(uuid) {
        this.deviceUUID = uuid;
    }

    protected getAuthKey(): string {
        let accessData = this.provider.getLatestAccessData();

        return `${accessData.AccessToken}-${this.deviceUUID}`;
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

    async requestMoreSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<ApiResponse<ClientSettingsStruct>> {
        return this.createApiRequest(`${ApiClient.getApiURL(ApiType.ACCOUNT, 'more_settings.json')}?since=${since}&lang=${language}`, new ClientSettingsStruct());
    }

    async requestLessSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<ApiResponse<ClientSettingsStruct>> {
        return this.createApiRequest(`${ApiClient.getApiURL(ApiType.ACCOUNT, 'less_settings.json')}?since=${since}&lang=${language}`, new ClientSettingsStruct());
    }

    protected async createApiRequest<T extends StructBase>(url: string, responseStruct: T): Promise<ApiResponse<T>> {
        let res = new ApiResponse<T>(responseStruct);

        let rawRes = await JsonUtil.parseLoseless(await request({
            url: url,
            headers: this.getSessionHeader(),
            method: 'GET'
        }));

        res.fromJson(rawRes);

        return res;
    }

    static getApiURL(type: ApiType, api: string) {
        return `${KakaoAPI.InternalURL}/${KakaoAPI.Agent}/${type}/${api}`;
    }

}

export enum ApiType {

    ACCOUNT = 'account',
    FRIENDS = 'friends'

}

export class ApiResponse<T extends StructBase> {

    constructor(
        private response: T,
        private status: KakaoAPI.RequestStatusCode = KakaoAPI.RequestStatusCode.SUCCESS
        ) {

    }

    get Status() {
        return this.status;
    }

    get Response() {
        return this.response;
    }

    fromJson(data: any): void {
        this.status = data['status'];

        this.response.fromJson(data);
    }

    toJson() {
        let obj = { 'status': this.status };

        obj = Object.assign(this.response.toJson(), obj);

        return obj;
    }

}