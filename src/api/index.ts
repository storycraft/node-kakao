/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AxiosRequestConfig } from "axios";
import { URLSearchParams } from "url";

export type RequestHeader = Record<string, any>;
export type RequestMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'LINK' | 'UNLINK';
export type FileRequestData = { value: ArrayBuffer, options: { filename: string, contentType?: string } };
export type RequestForm = { [key: string]: FileRequestData | any };

/**
 * Provides various web request api
 */
export class ApiClient implements HeaderDecorator {

    constructor(public scheme: string, public host: string, private _decorator?: HeaderDecorator) {

    }

    /**
     * Returns url
     */
    get url() {
        return `${this.scheme}://${this.host}`;
    }

    /**
     * Returns full url with path
     * @param path
     */
    toApiURL(path: string) {
        return `${this.url}/${path}`;
    }

    fillHeader(header: RequestHeader) {
        header['Host'] = this.host;
        this._decorator?.fillHeader(header);
    }

    private buildAxiosReqData(method: RequestMethod, header?: RequestHeader): AxiosRequestConfig {
        const reqHeader: RequestHeader = {};

        this.fillHeader(reqHeader);

        let reqData: AxiosRequestConfig = {
            headers: reqHeader,

            method: method,

            // https://github.com/axios/axios/issues/811
            // https://github.com/axios/axios/issues/907
            transformResponse: (data) => data,

            responseType: 'text'
        };

        if (header) Object.assign(reqHeader, header);

        return reqData;
    }

    protected convertToFormData(form: RequestForm): URLSearchParams {
        let formData = new URLSearchParams();

        let entries = Object.entries(form);
        for (let [ key, value ] of entries) {
            // hax for undefined, null values
            formData.append(key, value + '');
        }

        return formData;
    }

}

/**
 * Decorate common request headers
 */
export interface HeaderDecorator {

    fillHeader(header: RequestHeader): void;

}