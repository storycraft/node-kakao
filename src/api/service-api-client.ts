/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { createSessionWebClient, DataWebRequest, SessionWebClient } from './web-client';
import { DefaultConfiguration, WebApiConfig } from '../config';
import { OAuthCredential } from '../oauth';
import { AsyncCommandResult, DefaultRes, KnownDataStatusCode } from '../request';
import { JsonUtil } from '../util';
import {
  FriendFindIdStruct,
  FriendFindUUIDStruct,
  FriendListStruct,
  FriendReqPhoneNumberStruct,
  FriendReqStruct,
  FriendSearchStruct,
  LessSettingsStruct,
  LoginTokenStruct,
  MoreSettingsStruct,
  ProfileReqStruct,
} from './struct';

export class ServiceApiClient {
  private _client: DataWebRequest<SessionWebClient>;

  constructor(client: SessionWebClient) {
    this._client = new DataWebRequest(client);
  }

  get config(): WebApiConfig {
    return this._client.client.config;
  }

  set config(config: WebApiConfig) {
    this._client.client.config = config;
  }

  // account

  /**
   * Request more settings. Official client sends this after login
   *
   * @param {any} since Unknown
   */
  async requestMoreSettings(since = 0): AsyncCommandResult<MoreSettingsStruct> {
    const res = await this._client.requestData(
      'GET',
      // eslint-disable-next-line max-len
      `${this.getAccountApiPath('more_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(this.config.language)}`,
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & MoreSettingsStruct,
    };
  }

  /**
   * Request simplified settings. Official client sends this after login
   *
   * @param {any} since Unknown
   */
  async requestLessSettings(since = 0): AsyncCommandResult<LessSettingsStruct> {
    const res = await this._client.requestData(
      'GET',
      // eslint-disable-next-line max-len
      `${this.getAccountApiPath('less_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(this.config.language)}`,
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & LessSettingsStruct,
    };
  }

  async updateSettings(settings: Partial<unknown>): AsyncCommandResult {
    const res = await this._client.requestData('POST', this.getAccountApiPath('update_settings.json'), settings);

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  /**
   * Get one time web login token.
   *
   * Use @method requestSessionURL to get complete url.
   */
  async requestWebLoginToken(): AsyncCommandResult<LoginTokenStruct> {
    const res = await this._client.requestData('GET', this.getAccountApiPath('login_token.json'));

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & LoginTokenStruct,
    };
  }

  /**
   * Create session url. Redirect to redirectURL with session info included.
   *
   * @param {string} redirectURL
   */
  async requestSessionURL(redirectURL: string): AsyncCommandResult<string> {
    const res = await this.requestWebLoginToken();

    if (!res.success) return res;

    return {
      status: res.status,
      success: true,
      result: ServiceApiClient.createSessionURL(res.result.token, redirectURL),
    };
  }

  async canChangeUUID(uuid: string): AsyncCommandResult<DefaultRes> {
    const res = await this._client.requestData('POST', this.getAccountApiPath('can_change_uuid.json'), { uuid: uuid });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
  }

  async changeUUID(uuid: string): AsyncCommandResult<DefaultRes> {
    const res = await this._client.requestData('POST', this.getAccountApiPath('change_uuid.json'), { uuid: uuid });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
  }

  // friends

  async addFriend(id: Long, pa = ''): AsyncCommandResult<FriendReqStruct> {
    const res = await this._client.requestData(
      'GET',
      `${this.getFriendsApiPath('add')}/${encodeURIComponent(id.toString())}.json?pa=${encodeURIComponent(pa)}`,
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendReqStruct,
    };
  }

  async addFriendWithPhoneNumber(
    nickname: string,
    countryIso: string,
    countryCode: string,
    phoneNumber: string,
  ): AsyncCommandResult<FriendReqPhoneNumberStruct> {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('add_by_phonenumber.json'),
      {
        nickname: nickname,
        country_iso: countryIso,
        country_code: countryCode,
        phonenumber: phoneNumber,
      },
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendReqPhoneNumberStruct,
    };
  }

  async removeFriend(id: Long): AsyncCommandResult<FriendReqStruct> {
    const res = await this._client.requestData('POST', this.getFriendsApiPath('purge.json'), { id: id.toString() });

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendReqStruct,
    };
  }

  async removeFriendList(idList: Long[]): AsyncCommandResult {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('delete.json'),
      { ids: JsonUtil.stringifyLoseless(idList) },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async hideFriend(id: Long, pa = ''): AsyncCommandResult {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('hide.json'),
      { id: id.toString(), pa: pa }
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async unhideFriend(id: Long): AsyncCommandResult {
    const res = await this._client.requestData('POST', this.getFriendsApiPath('unhide.json'), { id: id.toString() });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async searchFriends(query: string, pageNum?: number, pageSize?: number): AsyncCommandResult<FriendSearchStruct> {
    let res;
    if (pageNum && pageSize) {
      res = await this._client.requestData(
        'GET',
        this.getFriendsApiPath('search.json'),
        { query: query, page_num: pageNum, page_size: pageSize },
      );
    } else {
      res = await this._client.requestData('GET', this.getFriendsApiPath('search.json'), { query });
    }

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendSearchStruct,
    };
  }

  async findFriendById(id: Long): AsyncCommandResult<FriendFindIdStruct> {
    const res = await this._client.requestData('GET', this.getFriendsApiPath(`${id.toString()}.json`));

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendFindIdStruct,
    };
  }

  async findFriendByUUID(uuid: string): AsyncCommandResult<FriendFindUUIDStruct> {
    const res = await this._client.requestData(
      'POST',
      `${this.getFriendsApiPath('find_by_uuid.json')}`,
      { uuid: uuid }
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendFindUUIDStruct,
    };
  }

  async requestFriendList(
    types: string[] = ['plus', 'normal'],
    eventTypes: string[] = ['create'],
    token: Long = Long.ZERO,
  ): AsyncCommandResult<FriendListStruct> {
    const res = await this._client.requestData(
      'GET',
      `${this.getFriendsApiPath('list.json')}`,
      { type: JSON.stringify(types), event_types: JSON.stringify(eventTypes), token },
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & FriendListStruct,
    };
  }

  async setNickname(id: Long, nickname: string): AsyncCommandResult {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('nickname.json'),
      { id: id.toString(), nickname: nickname },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async addFavoriteFriends(idList: Long[]): AsyncCommandResult {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('add_favorite.json'),
      { ids: JsonUtil.stringifyLoseless(idList) },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async removeFavoriteFriend(id: Long): AsyncCommandResult {
    const res = await this._client.requestData(
      'POST',
      this.getFriendsApiPath('remove_favorite.json'),
      { id: id.toString() },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  // profile

  async requestMusicList(id: Long): AsyncCommandResult<DefaultRes> {
    const res = await this._client.requestData('GET', this.getProfileApiPath('music/list.json'), { id: id.toString() });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
  }

  async requestMyProfile(): AsyncCommandResult<ProfileReqStruct> {
    const res = await this._client.requestData('GET', this.getProfile3ApiPath('me.json'));

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & ProfileReqStruct,
    };
  }

  async requestProfile(id: Long): AsyncCommandResult<ProfileReqStruct> {
    const res = await this._client.requestData(
      'GET',
      `${this.getProfile3ApiPath('friend_info.json')}?id=${encodeURIComponent(id.toString())}`,
    );

    return {
      status: res.status,
      success: res.status === KnownDataStatusCode.SUCCESS,
      result: res as DefaultRes & ProfileReqStruct
    };
  }

  // scrap

  async getPreviewURL(url: string): AsyncCommandResult<DefaultRes> {
    const res = await this._client.requestData('POST', this.getScrapApiPath('preview.json'), { url });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
  }

  private getAccountApiPath(api: string) {
    return `${this.config.agent}/account/${api}`;
  }

  private getFriendsApiPath(api: string) {
    return `${this.config.agent}/friends/${api}`;
  }

  private getProfileApiPath(api: string) {
    return `${this.config.agent}/profile/${api}`;
  }

  private getProfile3ApiPath(api: string) {
    return `${this.config.agent}/profile3/${api}`;
  }

  private getScrapApiPath(api: string) {
    return `${this.config.agent}/scrap/${api}`;
  }

  /**
   * Create default AccountClient using credential and config.
   *
   * @param {OAuthCredential} credential
   * @param {Partial<WebApiConfig>} config
   */
  static async create(credential: OAuthCredential, config: Partial<WebApiConfig> = {}): Promise<ServiceApiClient> {
    return new ServiceApiClient(
      await createSessionWebClient(
        credential,
        Object.assign({ ...DefaultConfiguration }, config),
        'https',
        'katalk.kakao.com',
      ),
    );
  }

  static createSessionURL(token: string, redirectURL: string): string {
    // eslint-disable-next-line max-len
    return `https://accounts.kakao.com/weblogin/login_redirect?continue=${encodeURIComponent(redirectURL)}&token=${token}`;
  }
}
