/*
 * Created on Mon Feb 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { WebApiConfig } from '../config';
import { OAuthCredential } from '../oauth';
import { DefaultRes } from '../request';
import { JsonUtil } from '../util';
import { isNode, isDeno, isBrowser } from '../util/platform';
import { fillAHeader, fillBaseHeader, fillCredential, getUserAgent } from './header-util';

export type RequestHeader = Record<string, string>;
export type RequestMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'LINK' | 'UNLINK';
export type FileRequestData = { value: ArrayBuffer, options: { filename: string, contentType?: string } };
export type RequestForm = { [key: string]: FileRequestData | number | string | undefined | null | boolean | Long };

/**
 * Provides various web request api
 */
export interface WebClient extends HeaderDecorator {

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
  request(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<ArrayBuffer>;

  /**
   * Request multipart form
   *
   * @param method
   * @param path
   * @param form
   * @param headers
   */
  requestMultipart(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader
  ): Promise<ArrayBuffer>;
}

export class TextWebRequest<T extends WebClient = WebClient> {
  constructor(private _client: T) {

  }

  get client(): T {
    return this._client;
  }

  async requestText(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: Record<string, string>
  ): Promise<string> {
    const res = await this._client.request(method, path, form, headers);

    return new TextDecoder('utf-8').decode(res);
  }

  async requestMultipartText(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader
  ): Promise<string> {
    const res = await this._client.requestMultipart(method, path, form, headers);

    return new TextDecoder('utf-8').decode(res);
  }

}

export class DataWebRequest<T extends WebClient = WebClient> {
  private _client: TextWebRequest<T>;

  constructor(client: T) {
    this._client = new TextWebRequest(client);
  }

  get client(): T {
    return this._client.client;
  }

  async requestData(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: Record<string, string>
  ): Promise<DefaultRes> {
    const res = await this._client.requestText(method, path, form, headers);

    return JsonUtil.parseLoseless(res);
  }

  async requestMultipartData(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: Record<string, string>
  ): Promise<DefaultRes> {
    const res = await this._client.requestMultipartText(method, path, form, headers);

    return JsonUtil.parseLoseless(res);
  }

}

/**
 * Api client with credential
 */
export class SessionWebClient implements WebClient {
  constructor(private _client: WebClient, private _credential: OAuthCredential, public config: WebApiConfig) {

  }

  fillHeader(header: Record<string, string>): void {
    fillCredential(header, this._credential);
  }

  get url(): string {
    return this._client.url;
  }

  private createSessionHeader(headers?: RequestHeader): RequestHeader {
    const credentialHeader = headers ? { ...headers } : {};
    this.fillHeader(credentialHeader);

    fillBaseHeader(credentialHeader, this.config);
    fillAHeader(credentialHeader, this.config);

    const userAgent = getUserAgent(this.config);
    credentialHeader['User-Agent'] = userAgent;

    return credentialHeader;
  }

  request(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<ArrayBuffer> {
    return this._client.request(method, path, form, this.createSessionHeader(headers));
  }

  requestMultipart(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader,
  ): Promise<ArrayBuffer> {
    return this._client.requestMultipart(method, path, form, this.createSessionHeader(headers));
  }
}

/**
 * Decorate common request headers
 */
export interface HeaderDecorator {

  fillHeader(header: RequestHeader): void;

}

/**
 * Create web client by platform
 *
 * @param {string} scheme
 * @param {string} host
 * @param {HeaderDecorator} decorator
 */
export async function createWebClient(scheme: string, host: string, decorator?: HeaderDecorator): Promise<WebClient> {
  if (isNode()) {
    return new (await import('./axios-web-client')).AxiosWebClient(scheme, host, decorator);
  } else if (isDeno()) {
    return new (await import('./fetch-web-client')).FetchWebClient(scheme, host, decorator);
  } else if (isBrowser()) {
    return new (await import('./fetch-web-client')).FetchWebClient(scheme, host, decorator);
  } else {
    throw new Error('Unknown environment');
  }
}

export async function createSessionWebClient(
  credential: OAuthCredential,
  config: WebApiConfig,
  scheme: string,
  host: string,
  decorator?: HeaderDecorator,
): Promise<SessionWebClient> {
  return new SessionWebClient(await createWebClient(scheme, host, decorator), credential, config);
}
