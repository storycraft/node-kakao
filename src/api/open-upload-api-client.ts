/*
 * Created on Sat Apr 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkAnonProfile } from '../openlink';
import { AsyncCommandResult, KnownDataStatusCode } from '../request';
import { OpenProfilePostUploadStruct, OpenProfileUploadStruct } from './struct';
import { createWebClient, TextWebRequest, WebClient } from './web-client';

/**
 * OpenLink profile, link post upload api
 */
export class OpenUploadApiClient {
  private _client: TextWebRequest;

  constructor(
    client: WebClient
  ) {
    this._client = new TextWebRequest(client);
  }

  /**
   * Upload openlink profile image
   *
   * @param {string} name filename
   * @param {Uint8Array} file
   * @param {string} [contentType='image/jpeg']
   * @return {AsyncCommandResult<OpenProfileUploadStruct>}
   */
  async uploadLinkImage(
    name: string,
    file: Uint8Array,
    contentType = 'image/jpeg'
  ): AsyncCommandResult<OpenProfileUploadStruct> {
    const res = await this._client.requestText(
      'POST',
      'up/open-chat-profile',
      { 'file_1': { value: file, options: { filename: name, contentType: contentType } } }
    );

    try {
      const json = JSON.parse(res) as OpenProfileUploadStruct;

      return { status: KnownDataStatusCode.SUCCESS, success: true, result: json };
    } catch (e) {
      return { status: KnownDataStatusCode.OPERATION_DENIED, success: false };
    }
  }

  /**
   * Upload openlink profile post image
   *
   * @param {string} name filename
   * @param {Uint8Array} file
   * @param {string} [contentType='image/jpeg']
   * @return {AsyncCommandResult<OpenProfileUploadStruct>}
   */
  async uploadLinkPostImage(
    name: string,
    file: Uint8Array,
    contentType = 'image/jpeg'
  ): AsyncCommandResult<OpenProfilePostUploadStruct> {
    const res = await this._client.requestText(
      'POST',
      'up/open-chat-profile-post',
      { 'file_1': { value: file, options: { filename: name, contentType: contentType } } }
    );
    
    try {
      const json = JSON.parse(res) as OpenProfilePostUploadStruct;

      return { status: KnownDataStatusCode.SUCCESS, success: true, result: json };
    } catch (e) {
      return { status: KnownDataStatusCode.OPERATION_DENIED, success: false };
    }
  }

  /**
   * Create default OpenUploadApiClient.
   */
  static async create(): Promise<OpenUploadApiClient> {
    return new OpenUploadApiClient(
      await createWebClient(
        'https',
        'up-api1-kage.kakao.com',
      ),
    );
  }

}

export namespace OpenUploadAPI {

  let client: OpenUploadApiClient | null = null;

  export function getOriginalLinkImageURL(accessKey: string): string {
    return `http://open.kakaocdn.net/dn/${accessKey}/img.jpg`;
  }

  export function getSmallLinkImageURL(accessKey: string): string {
    return `http://open.kakaocdn.net/dn/${accessKey}/img_s.jpg`;
  }

  export function getLargeLinkImageURL(accessKey: string): string {
    return `http://open.kakaocdn.net/dn/${accessKey}/img_l.jpg`;
  }

  /**
   * Upload profile image and construct OpenLink anon profile using nickname.
   *
   * @param {string} nickname Profile nickname
   * @param {Uint8Array} profile Profile image
   * @return {AsyncCommandResult<OpenLinkAnonProfile>}
   */
  export async function buildProfile(nickname: string, profile: Uint8Array): AsyncCommandResult<OpenLinkAnonProfile> {
    if (!client) client = await OpenUploadApiClient.create();

    const res = await client.uploadLinkImage('profile.png', profile);
    if (!res.success) return res;

    return {
      status: KnownDataStatusCode.SUCCESS,
      success: true,
      result: { nickname, profilePath: res.result.access_key }
    };
  }

}