/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import {
  WebClient,
  HeaderDecorator,
  RequestForm,
  RequestHeader,
  RequestMethod,
  FileRequestData,
} from './web-client';
import { convertToFormData } from './web-api-util';

/**
 * WebClient implementation wrapped with fetch api
 */
export class FetchWebClient implements WebClient, HeaderDecorator {
  constructor(public scheme: string, public host: string, private _decorator?: HeaderDecorator) {

  }

  get url(): string {
    return `${this.scheme}://${this.host}`;
  }

  toApiURL(path: string): string {
    return `${this.url}/${path}`;
  }

  fillHeader(header: RequestHeader): void {
    header['Host'] = this.host;
    this._decorator?.fillHeader(header);
  }

  private buildFetchReqData(method: RequestMethod, header?: RequestHeader): RequestInit {
    const headers: RequestHeader = {};

    this.fillHeader(headers);

    if (header) Object.assign(headers, header);

    const reqData: RequestInit = {
      headers,
      method,
    };

    return reqData;
  }

  async request(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader,
  ): Promise<ArrayBuffer> {
    const reqData = this.buildFetchReqData(method, headers);
    const url = this.toApiURL(path);

    if (form) {
      reqData.body = convertToFormData(form);
    }

    const res = await fetch(url, reqData);

    if (!res.ok) {
      throw new Error(`Web request failed with status ${res.status} ${res.statusText}`);
    }

    return await res.arrayBuffer();
  }

  async requestMultipart(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader,
  ): Promise<ArrayBuffer> {
    const reqData = this.buildFetchReqData(method, headers);
    const url = this.toApiURL(path);

    if (form) {
      reqData.body = this.convertToMultipart(form);
    }

    const res = await fetch(url, reqData);

    if (!res.ok) {
      throw new Error(`Web request failed with status ${res.status} ${res.statusText}`);
    }

    return await res.arrayBuffer();
  }

  protected convertToMultipart(form: RequestForm): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(form)) {
      if (value && (value as FileRequestData).value && (value as FileRequestData).options) {
        const file = value as FileRequestData;

        formData.append(
          key,
          new File(
            [new Blob([file.value])],
            file.options.filename,
            { type: file.options.contentType }
          )
        );
      } else {
        formData.append(key, value + '');
      }
    }

    return formData;
  }
}
