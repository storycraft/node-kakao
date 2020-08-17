/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration } from "../config/client-config";
import { JsonUtil } from "../util/json-util";
import { WebApiStruct } from "../talk/struct/web-api-struct";
import { Long } from "bson";
import { FriendReqStruct, FriendReqPhoneNumberStruct } from "../talk/struct/api/friends/friend-req-struct";
import { FriendListStruct } from "../talk/struct/api/friends/friend-list-struct";
import { FriendFindIdStruct, FriendFindUUIDStruct } from "../talk/struct/api/friends/friend-find-struct";
import { FriendDeleteStruct } from "../talk/struct/api/friends/friend-delete-struct";
import { FriendBlockedListStruct } from "../talk/struct/api/friends/friend-blocked-list-struct";
import { FriendSearchStruct } from "../talk/struct/api/friends/friend-search-struct";
import { FriendNicknameStruct } from "../talk/struct/api/friends/friend-nickname-struct";
import { ProfileReqStruct } from "../talk/struct/api/profile/profile-req-struct";
import { SessionApiClient } from "./web-api-client";

export class ServiceClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'katalk.kakao.com';
    }
	
	// account
	
	async canChangeUUID(uuid: string): Promise<WebApiStruct> {
		return this.request("POST", ServiceClient.getAccountApiPath('can_change_uuid.json'), { uuid: uuid });
	}

	async changeUUID(uuid: string): Promise<WebApiStruct> {
		return this.request("POST", ServiceClient.getAccountApiPath('change_uuid.json'), { uuid: uuid });
	}

    // friends

    async addFriend(id: Long, pa: string = ''): Promise<FriendReqStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath('add')}/${encodeURIComponent(id.toString())}.json?pa=${encodeURIComponent(pa)}`);
    }

    async addFriendWithPhoneNumber(nickname: string, countryIso: string, countryCode: string, phoneNumber: string): Promise<FriendReqPhoneNumberStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('add_by_phonenumber.json'), { nickname: nickname, country_iso: countryIso, country_code: countryCode, phonenumber: phoneNumber });
    }

    async removeFriend(id: Long): Promise<FriendReqStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('purge.json'), { id: id.toString() });
    }

    async removeFriendList(idList: Long[]): Promise<FriendDeleteStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('delete.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async hideFriend(id: Long, pa: string = ''): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('hide.json'), { id: id.toString(), pa: pa });
    }

    async unhideFriend(id: Long): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('unhide.json'), { id: id.toString() });
    }

    async searchFriends(query: string, pageNum?: number, pageSize?: number): Promise<FriendSearchStruct> {
        if (pageNum && pageSize) return this.request('GET', ServiceClient.getFriendsApiPath('search.json'), { query: query, page_num: pageNum, page_size: pageSize });

        return this.request('GET', ServiceClient.getFriendsApiPath('search.json'), { query });
    }

    async findFriendById(id: Long): Promise<FriendFindIdStruct> {
        return this.request('GET', ServiceClient.getFriendsApiPath(`${id.toString()}.json`)); // 200 iq logics
    }

    async findFriendByUUID(uuid: string): Promise<FriendFindUUIDStruct> {
        return this.request('POST', `${ServiceClient.getFriendsApiPath('find_by_uuid.json')}`, { uuid: uuid });
    }

    async requestFriendList(types: string[] = [ 'plus', 'normal' ], eventTypes: string[] = [ 'create' ], token: Long = Long.ZERO): Promise<FriendListStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath('list.json')}`, { type: JSON.stringify(types), event_types: JSON.stringify(eventTypes), token: token.toString() });
    }

    async requestBlockedFriendList(): Promise<FriendBlockedListStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath('blocked.json')}`);
    }

    async setNickname(id: Long, nickname: string): Promise<FriendNicknameStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('nickname.json'), { id: id.toString(), nickname: nickname });
    }

    async addFavoriteFriends(idList: Long[]): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('add_favorite.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async removeFavoriteFriend(id: Long): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath('remove_favorite.json'), { id: id.toString() });
    }

    // profile

    async requestMyProfile(): Promise<ProfileReqStruct> {
        return this.request('GET', ServiceClient.getProfile3ApiPath('me.json'));
    }

    async requestProfile(id: Long): Promise<ProfileReqStruct> {
        return this.request('GET', `${ServiceClient.getProfile3ApiPath('friend_info.json')}?id=${encodeURIComponent(id.toString())}`);
    }

    // scrap
    
    async getPreviewURL(url: string): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getScrapApiPath('preview.json'), { url: url });
    }
	
    static getAccountApiPath(api: string) {
        return `${DefaultConfiguration.agent}/account/${api}`;
    }
	
    static getFriendsApiPath(api: string) {
        return `${DefaultConfiguration.agent}/friends/${api}`;
    }

    static getProfile3ApiPath(api: string) {
        return `${DefaultConfiguration.agent}/profile3/${api}`;
    }

    static getScrapApiPath(api: string) {
        return `${DefaultConfiguration.agent}/scrap/${api}`;
    }

}