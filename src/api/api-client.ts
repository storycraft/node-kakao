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
import { StructBaseOld } from "../talk/struct/struct-base";
import { WrappedObject, NameMapping, ConvertMap, ObjectMapper, Serializer } from "json-proxy-mapper";
import { ApiStruct } from "../talk/struct/api/api-struct";

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

        return `${accessData.accessToken}-${this.deviceUUID}`;
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

    async requestMoreSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<ClientSettingsStruct> {
        return this.createApiRequest(`${ApiClient.getApiURL(ApiType.ACCOUNT, 'more_settings.json')}?since=${since}&lang=${language}`);
    }

    async requestLessSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<ClientSettingsStruct> {
        return this.createApiRequest(`${ApiClient.getApiURL(ApiType.ACCOUNT, 'less_settings.json')}?since=${since}&lang=${language}`);
    }

    protected async createApiRequest<T extends ApiStruct>(url: string, mapper?: ObjectMapper): Promise<T> {
        let rawRes = JsonUtil.parseLoseless(await request({
            url: url,
            headers: this.getSessionHeader(),
            method: 'GET'
        }));

        if (mapper) return Serializer.deserialize<T>(rawRes, mapper);

        return rawRes;
    }

    static getApiURL(type: ApiType, api: string) {
        return `${KakaoAPI.InternalURL}/${KakaoAPI.Agent}/${type}/${api}`;
    }

}

export enum ApiType {

    ACCOUNT = 'account',
    FRIENDS = 'friends'

}