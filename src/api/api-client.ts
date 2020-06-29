/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as request from "request-promise";

import { KakaoAPI } from "../kakao-api";
import { JsonUtil } from "../util/json-util";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { MoreSettingsStruct, LessSettingsStruct } from "../talk/struct/api/account/client-settings-struct";
import { ObjectMapper, Serializer } from "json-proxy-mapper";
import { ApiStruct } from "../talk/struct/api/api-struct";
import { LoginTokenStruct } from "../talk/struct/api/account/login-token-struct";
import { Long } from "bson";
import { FriendReqStruct } from "../talk/struct/api/friends/friend-req-struct";
import { FriendListStruct } from "../talk/struct/api/friends/friend-list-struct";
import { FriendFindIdStruct, FriendFindUUIDStruct } from "../talk/struct/api/friends/friend-find-struct";
import { FriendDeleteStruct } from "../talk/struct/api/friends/friend-delete-struct";
import { FriendBlockedListStruct } from "../talk/struct/api/friends/friend-blocked-list-struct";
import { FriendSearchStruct } from "../talk/struct/api/friends/friend-search-struct";
import { FriendNicknameStruct } from "../talk/struct/api/friends/friend-nickname-struct";
import { ProfileReqStruct } from "../talk/struct/api/profile/profile-req-struct";
import { WebApiClient } from "./web-api-client";

export class ApiClient implements WebApiClient {

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

    // account

    async requestMoreSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<MoreSettingsStruct> {
        return this.createApiRequest('GET', `${ApiClient.getAccountApiURL('more_settings.json')}?since=${since}&lang=${language}`);
    }

    async requestLessSettings(since: number = 0, language: string = KakaoAPI.Language): Promise<LessSettingsStruct> {
        return this.createApiRequest('GET', `${ApiClient.getAccountApiURL('less_settings.json')}?since=${since}&lang=${language}`);
    }

    async requestWebLoginToken(): Promise<LoginTokenStruct> {
        return this.createApiRequest('GET', ApiClient.getAccountApiURL('login_token.json'));
    }

    // friends

    async addFriend(id: Long, pa: string = ''): Promise<FriendReqStruct> {
        return this.createApiRequest('GET', `${ApiClient.getFriendsApiURL('add')}/${id}.json?pa=${pa}`);
    }

    async removeFriend(id: Long): Promise<FriendReqStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('purge.json'), { id: id.toString() });
    }

    async removeFriendList(idList: Long[]): Promise<FriendDeleteStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('delete.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async hideFriend(id: Long, pa: string = ''): Promise<ApiStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('hide.json'), { id: id.toString(), pa: pa });
    }

    async unhideFriend(id: Long): Promise<ApiStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('unhide.json'), { id: id.toString() });
    }

    async searchFriends(query: string, pageNum?: number, pageSize?: number): Promise<FriendSearchStruct> {
        if (pageNum && pageSize) return this.createApiFormRequest('GET', ApiClient.getFriendsApiURL('search.json'), { query: query, page_num: pageNum, page_size: pageSize });

        return this.createApiFormRequest('GET', ApiClient.getFriendsApiURL('search.json'), { query });
    }

    async findFriendById(id: Long): Promise<FriendFindIdStruct> {
        return this.createApiRequest('GET', ApiClient.getFriendsApiURL(`${id.toString()}.json`)); // 200 iq logics
    }

    async findFriendByUUID(uuid: string): Promise<FriendFindUUIDStruct> {
        return this.createApiFormRequest('GET', `${ApiClient.getFriendsApiURL('find_by_uuid.json')}`, { uuid: uuid });
    }

    async requestFriendList(types: string[] = [ 'plus', 'normal' ], eventTypes: string[] = [ 'create' ], token: Long = Long.ZERO): Promise<FriendListStruct> {
        return this.createApiFormRequest('GET', `${ApiClient.getFriendsApiURL('list.json')}`, { type: JSON.stringify(types), event_types: JSON.stringify(eventTypes), token: token.toString() });
    }

    async requestBlockedFriendList(): Promise<FriendBlockedListStruct> {
        return this.createApiRequest('GET', `${ApiClient.getFriendsApiURL('blocked.json')}`);
    }

    async setNickname(id: Long, nickname: string): Promise<FriendNicknameStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('nickname.json'), { id: id.toString(), nickname: nickname });
    }

    async addFavoriteFriends(idList: Long[]): Promise<ApiStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('add_favorite.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async removeFavoriteFriend(id: Long): Promise<ApiStruct> {
        return this.createApiFormRequest('POST', ApiClient.getFriendsApiURL('remove_favorite.json'), { id: id.toString() });
    }

    // profile

    async requestMyProfile(): Promise<ProfileReqStruct> {
        return this.createApiRequest('GET', ApiClient.getProfile3ApiURL('me.json'));
    }

    async requestProfile(id: Long): Promise<ProfileReqStruct> {
        return this.createApiRequest('GET', `${ApiClient.getProfile3ApiURL('friend_info.json')}?id=${id}`);
    }

    protected async createApiRequest<T extends ApiStruct>(method: string, url: string, mapper?: ObjectMapper): Promise<T> {
        let rawRes = JsonUtil.parseLoseless(await request({
            url: url,
            headers: this.getSessionHeader(),
            method: method
        }));

        if (mapper) return Serializer.deserialize<T>(rawRes, mapper);

        return rawRes;
    }

    // application/x-www-form-urlencoded
    protected async createApiFormRequest<T extends ApiStruct>(method: string, url: string, form: any, mapper?: ObjectMapper): Promise<T> {
        let rawRes = JsonUtil.parseLoseless(await request({
            url: url,
            headers: this.getSessionHeader(),
            form: form,
            method: method
        }));

        if (mapper) return Serializer.deserialize<T>(rawRes, mapper);

        return rawRes;
    }

    static getAccountApiURL(api: string) {
        return `${KakaoAPI.InternalURL}/${KakaoAPI.Agent}/account/${api}`;
    }

    static getFriendsApiURL(api: string) {
        return `${KakaoAPI.ServiceURL}/${KakaoAPI.Agent}/friends/${api}`;
    }

    static getProfile3ApiURL(api: string) {
        return `${KakaoAPI.ServiceURL}/${KakaoAPI.Agent}/profile3/${api}`;
    }

}