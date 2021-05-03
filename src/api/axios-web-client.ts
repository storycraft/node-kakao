/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AxiosRequestConfig } from 'axios';
import Axios from 'axios';
import {
  HeaderDecorator,
  RequestHeader,
  RequestMethod,
  RequestForm,
  WebClient,
  FileRequestData,
} from './web-client';
import { convertToFormData } from './web-api-util';
import FormData from 'form-data';

/**
 * WebClient implementation wrapped with axios
 */
export class AxiosWebClient implements WebClient, HeaderDecorator {
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

  private buildAxiosReqData(method: RequestMethod, header?: RequestHeader): AxiosRequestConfig {
    const headers: RequestHeader = {};

    this.fillHeader(headers);

    const reqData: AxiosRequestConfig = {
      headers,

      method,

      // https://github.com/axios/axios/issues/811
      // https://github.com/axios/axios/issues/907
      transformResponse: (data) => data,

      responseType: 'arraybuffer',

      maxContentLength: 100000000,
      maxBodyLength: 100000000
    };

    if (header) Object.assign(headers, header);

    return reqData;
  }

  async request(
    method: RequestMethod,
    path: string,
    form?: RequestForm,
    headers?: RequestHeader,
  ): Promise<ArrayBuffer> {
    const reqData = this.buildAxiosReqData(method, headers);
    reqData.url = this.toApiURL(path);

    if (form) {
      const formData = convertToFormData(form);

      reqData.data = formData.toString();
    }

    const res = await Axios.request(reqData);

    if (res.status !== 200) {
      throw new Error(`Web request failed with status ${res.status} ${res.statusText}`);
    }

    return res.data;
  }

  async requestMultipart(
      method: RequestMethod,
      path: string,
      form?: RequestForm,
      headers?: RequestHeader,
  ): Promise<ArrayBuffer> {
    const reqData = this.buildAxiosReqData(method, headers);
    reqData.url = this.toApiURL(path);

    if (form) {
      const formData = this.convertToMultipart(form);
      Object.assign(reqData.headers, formData.getHeaders());
      reqData.data = formData.getBuffer();
    }

    const res = await Axios.request(reqData);

    if (res.status !== 200) {
      throw new Error(`Web request failed with status ${res.status} ${res.statusText}`);
    }

    return res.data;
  }

  protected convertToMultipart(form: RequestForm): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(form)) {
      if (value && (value as FileRequestData).value && (value as FileRequestData).options) {
        const file = value as FileRequestData;

        formData.append(key, Buffer.from(file.value), file.options);
      } else {
        formData.append(key, value + '');
      }
    }

    return formData;
  }
}
