/*
 * Created on Mon Feb 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiConfig } from '../config';
import { OAuthCredential } from '../oauth';
import { DefaultRes } from '../request';
import { isNode, isDeno, isBrowser } from '../util/platform';
import { fillAHeader, fillBaseHeader, getUserAgent } from './header-util';

export type RequestHeader = Record<string, any>;
export type RequestMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'LINK' | 'UNLINK';
export type FileRequestData = { value: ArrayBuffer, options: { filename: string, contentType?: string } };
export type RequestForm = { [key: string]: FileRequestData | any };

/**
 * Provides various web request api
 */
export interface ApiClient extends HeaderDecorator {

    /**
     * Returns url
     */
    readonly url: string;

    /**
     * Request with optional form and header overrides
     * @param method
     * @param path
     * @param form
     * @param headers
     */
    request(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<DefaultRes>;

    /**
     * Request multipart form
     *
     * @param method
     * @param path
     * @param form
     * @param headers
     */
    requestMultipart(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<DefaultRes>;

}

/**
 * Api client with credential
 */
export class SessionApiClient implements ApiClient {
  constructor(private _client: ApiClient, private _credential: OAuthCredential, public config: WebApiConfig) {

  }

  get url() {
    return this._client.url;
  }

  private createSessionHeader(headers?: Record<string, any>): Record<string, any> {
    const credentialHeader = headers ? { ...headers } : {};
    this.fillHeader(credentialHeader);

    fillBaseHeader(credentialHeader, this.config);
    fillAHeader(credentialHeader, this.config);

    const userAgent = getUserAgent(this.config);
    credentialHeader['User-Agent'] = userAgent;

    return credentialHeader;
  }

  request(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
    return this._client.request(method, path, form, this.createSessionHeader(headers));
  }

  requestMultipart(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
    return this._client.requestMultipart(method, path, form, this.createSessionHeader(headers));
  }

  fillHeader(header: Record<string, any>): void {
    header['Authorization'] = `${this._credential.accessToken}-${this._credential.deviceUUID}`;
  }
}

/**
 * Decorate common request headers
 */
export interface HeaderDecorator {

    fillHeader(header: RequestHeader): void;

}

/**
 * Create api client by platform
 *
 * @param scheme
 * @param host
 * @param decorator
 */
export async function createApiClient(scheme: string, host: string, decorator?: HeaderDecorator): Promise<ApiClient> {
  if (isNode()) {
    return new (await import('./axios-api-client')).AxiosApiClient(scheme, host, decorator);
  } else if (isDeno()) {
    return new (await import('./fetch-api-client')).FetchApiClient(scheme, host, decorator);
  } else if (isBrowser()) {
    return new (await import('./fetch-api-client')).FetchApiClient(scheme, host, decorator);
  } else {
    throw new Error('Unknown environment');
  }
}

export async function createSessionApiClient(credential: OAuthCredential, config: WebApiConfig, scheme: string, host: string, decorator?: HeaderDecorator): Promise<SessionApiClient> {
  return new SessionApiClient(await createApiClient(scheme, host, decorator), credential, config);
}
