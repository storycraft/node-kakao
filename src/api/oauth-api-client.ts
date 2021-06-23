/*
 * Created on Sat Feb 13 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiConfig, DefaultConfiguration } from '../config';
import { OAuthCredential, OAuthInfo } from '../oauth';
import { AsyncCommandResult, KnownDataStatusCode } from '../request';
import { fillAHeader, fillBaseHeader, fillCredential, getUserAgent } from './header-util';
import { WebClient, createWebClient, RequestHeader, DataWebRequest } from './web-client';

export class OAuthApiClient {
  private _client: DataWebRequest;

  constructor(
    client: WebClient,
    public config: WebApiConfig,
  ) {
    this._client = new DataWebRequest(client);
  }

  private createOAuthHeader(credential: OAuthCredential): RequestHeader {
    const header: RequestHeader = {};

    fillBaseHeader(header, this.config);
    fillAHeader(header, this.config);
    fillCredential(header, credential);
    const userAgent = getUserAgent(this.config);
    header['User-Agent'] = userAgent;

    return header;
  }

  /**
   * Renew oauth credential using refresh token
   *
   * @param {OAuthCredential} credential
   */
  async renew(credential: OAuthCredential): AsyncCommandResult<OAuthInfo> {
    const res = await this._client.requestData(
      'POST',
      `${this.config.agent}/account/oauth2_token.json`,
      {
        'grant_type': 'refresh_token',
        'access_token': credential.accessToken,
        'refresh_token': credential.refreshToken
      },
      this.createOAuthHeader(credential)
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) {
      return { status: res.status, success: false };
    }

    return {
      status: res.status,
      success: true,
      result: {
        type: res['token_type'] as string,
        credential: {
          userId: credential.userId,
          deviceUUID: credential.deviceUUID,
          accessToken: res['access_token'] as string,
          refreshToken: res['refresh_token'] as string
        },
        expiresIn: res['expires_in'] as number
      }
    };
  }

  /**
   * Create default OAuthApiClient using credential and config.
   *
   * @param {Partial<WebApiConfig>} config
   */
    static async create(config: Partial<WebApiConfig> = {}): Promise<OAuthApiClient> {
      return new OAuthApiClient(
        await createWebClient(
          'https',
          'katalk.kakao.com',
        ),
        Object.assign({ ...DefaultConfiguration }, config),
      );
    }
}