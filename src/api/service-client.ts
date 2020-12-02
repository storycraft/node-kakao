/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { FriendBlockedListStruct } from "../talk/struct/api/friends/friend-blocked-list-struct";
import { FriendDeleteStruct } from "../talk/struct/api/friends/friend-delete-struct";
import { FriendFindIdStruct, FriendFindUUIDStruct } from "../talk/struct/api/friends/friend-find-struct";
import { FriendListStruct } from "../talk/struct/api/friends/friend-list-struct";
import { FriendNicknameStruct } from "../talk/struct/api/friends/friend-nickname-struct";
import { FriendReqPhoneNumberStruct, FriendReqStruct } from "../talk/struct/api/friends/friend-req-struct";
import { FriendSearchStruct } from "../talk/struct/api/friends/friend-search-struct";
import { ProfileReqStruct } from "../talk/struct/api/profile/profile-req-struct";
import { WebApiStruct } from "../talk/struct/web-api-struct";
import { JsonUtil } from "../util/json-util";
import { SessionApiClient } from "./web-api-client";

export class ServiceClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'katalk.kakao.com';
    }

    get Agent() {
        return this.ConfigProvider.Configuration.agent;
    }
	
	// account
	
	async canChangeUUID(uuid: string): Promise<WebApiStruct> {
		return this.request("POST", ServiceClient.getAccountApiPath(this.Agent, 'can_change_uuid.json'), { uuid: uuid });
	}

	async changeUUID(uuid: string): Promise<WebApiStruct> {
		return this.request("POST", ServiceClient.getAccountApiPath(this.Agent, 'change_uuid.json'), { uuid: uuid });
	}

    // friends

    async addFriend(id: Long, pa: string = ''): Promise<FriendReqStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath(this.Agent, 'add')}/${encodeURIComponent(id.toString())}.json?pa=${encodeURIComponent(pa)}`);
    }

    async addFriendWithPhoneNumber(nickname: string, countryIso: string, countryCode: string, phoneNumber: string): Promise<FriendReqPhoneNumberStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'add_by_phonenumber.json'), { nickname: nickname, country_iso: countryIso, country_code: countryCode, phonenumber: phoneNumber });
    }

    async removeFriend(id: Long): Promise<FriendReqStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'purge.json'), { id: id.toString() });
    }

    async removeFriendList(idList: Long[]): Promise<FriendDeleteStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'delete.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async hideFriend(id: Long, pa: string = ''): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'hide.json'), { id: id.toString(), pa: pa });
    }

    async unhideFriend(id: Long): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'unhide.json'), { id: id.toString() });
    }

    async searchFriends(query: string, pageNum?: number, pageSize?: number): Promise<FriendSearchStruct> {
        if (pageNum && pageSize) return this.request('GET', ServiceClient.getFriendsApiPath(this.Agent, 'search.json'), { query: query, page_num: pageNum, page_size: pageSize });

        return this.request('GET', ServiceClient.getFriendsApiPath(this.Agent, 'search.json'), { query });
    }

    async findFriendById(id: Long): Promise<FriendFindIdStruct> {
        return this.request('GET', ServiceClient.getFriendsApiPath(this.Agent, `${id.toString()}.json`)); // 200 iq logics
    }

    async findFriendByUUID(uuid: string): Promise<FriendFindUUIDStruct> {
        return this.request('POST', `${ServiceClient.getFriendsApiPath(this.Agent, 'find_by_uuid.json')}`, { uuid: uuid });
    }

    async requestFriendList(types: string[] = [ 'plus', 'normal' ], eventTypes: string[] = [ 'create' ], token: Long = Long.ZERO): Promise<FriendListStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath(this.Agent, 'list.json')}`, { type: JSON.stringify(types), event_types: JSON.stringify(eventTypes), token: token.toString() });
    }

    async requestBlockedFriendList(): Promise<FriendBlockedListStruct> {
        return this.request('GET', `${ServiceClient.getFriendsApiPath(this.Agent, 'blocked.json')}`);
    }

    async setNickname(id: Long, nickname: string): Promise<FriendNicknameStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'nickname.json'), { id: id.toString(), nickname: nickname });
    }

    async addFavoriteFriends(idList: Long[]): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'add_favorite.json'), { ids: JsonUtil.stringifyLoseless(idList) });
    }

    async removeFavoriteFriend(id: Long): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getFriendsApiPath(this.Agent, 'remove_favorite.json'), { id: id.toString() });
    }

    // profile

    async requestMusicList(id: Long): Promise<WebApiStruct> {
        return this.request('GET', ServiceClient.getProfileApiPath(this.Agent, 'music/list.json'), { id: id.toString() });
    }

    async requestMyProfile(): Promise<ProfileReqStruct> {
        return this.request('GET', ServiceClient.getProfile3ApiPath(this.Agent, 'me.json'));
    }

    async requestProfile(id: Long): Promise<ProfileReqStruct> {
        return this.request('GET', `${ServiceClient.getProfile3ApiPath(this.Agent, 'friend_info.json')}?id=${encodeURIComponent(id.toString())}`);
    }

    // scrap
    
    async getPreviewURL(url: string): Promise<WebApiStruct> {
        return this.request('POST', ServiceClient.getScrapApiPath(this.Agent, 'preview.json'), { url: url });
    }
	
    static getAccountApiPath(agent: string, api: string) {
        return `${agent}/account/${api}`;
    }
	
    static getFriendsApiPath(agent: string, api: string) {
        return `${agent}/friends/${api}`;
    }

    static getProfileApiPath(agent: string, api: string) {
        return `${agent}/profile/${api}`;
    }

    static getProfile3ApiPath(agent: string, api: string) {
        return `${agent}/profile3/${api}`;
    }

    static getScrapApiPath(agent: string, api: string) {
        return `${agent}/scrap/${api}`;
    }

}