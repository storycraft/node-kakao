/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { HeaderDecorator, RequestHeader, RequestMethod, RequestForm, ApiClient, FileRequestData } from ".";
import { DefaultRes } from "../request";
import { JsonUtil } from "../util";

/**
 * ApiClient implementation wrapped with fetch api
 */
export class FetchApiClient implements ApiClient, HeaderDecorator {

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

    private buildFetchReqData(method: RequestMethod, header?: RequestHeader): RequestInit {
        const headers: RequestHeader = {};
        
        this.fillHeader(headers);

        if (header) Object.assign(headers, header);

        const reqData: RequestInit = {
            headers,
            method
        };

        return reqData;
    }

    async request(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
        const reqData = this.buildFetchReqData(method, headers);
        const url = this.toApiURL(path);

        if (form) {
            const formData = this.convertToFormData(form);

            reqData.body = formData;
        }

        return JsonUtil.parseLoseless(await (await fetch(url, reqData)).text());
    }

    async requestMultipart(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
        const reqData = this.buildFetchReqData(method, headers);
        const url = this.toApiURL(path);

        if (form) {
            const formData = this.convertToMultipart(form);

            reqData.body = formData;
        }

        return JsonUtil.parseLoseless(await (await fetch(url, reqData)).text());
    }

    protected convertToMultipart(form: RequestForm): FormData {
        const formData = new FormData();

        for (const [ key, value ] of Object.entries(form)) {
            if (value && 'value' in value && 'options' in value) {
                const file = value as FileRequestData;
                formData.append(key, new Blob([ new Uint8Array(file.value) ], { type: file.options.contentType }), file.options.filename);
            } else {
                formData.append(key, value + '');
            }
        }

        return formData;
    }

    protected convertToFormData(form: RequestForm): URLSearchParams {
        const formData = new URLSearchParams();

        for (const [ key, value ] of Object.entries(form)) {
            // hax for undefined, null values
            formData.append(key, value + '');
        }

        return formData;
    }

}