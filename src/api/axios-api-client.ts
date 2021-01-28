/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AxiosRequestConfig } from "axios";
import Axios from "axios";
import { HeaderDecorator, RequestHeader, RequestMethod, RequestForm, ApiClient, FileRequestData } from ".";
import { DefaultRes } from "../request";
import { JsonUtil } from "../util";
import FormData from "form-data";

/**
 * ApiClient implementation wrapped with axios
 */
export class AxiosApiClient implements ApiClient, HeaderDecorator {

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
        const headers: RequestHeader = {};

        this.fillHeader(headers);

        const reqData: AxiosRequestConfig = {
            headers,

            method,

            // https://github.com/axios/axios/issues/811
            // https://github.com/axios/axios/issues/907
            transformResponse: (data) => data,

            responseType: 'text'
        };

        if (header) Object.assign(headers, header);

        return reqData;
    }

    async request(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
        const reqData = this.buildAxiosReqData(method, headers);
        reqData.url = this.toApiURL(path);

        if (form) {
            const formData = this.convertToFormData(form);

            reqData.data = formData.toString();
        }

        return JsonUtil.parseLoseless((await Axios.request(reqData)).data);
    }

    async requestMultipart(method: RequestMethod, path: string, form?: RequestForm, headers?: Record<string, any>): Promise<DefaultRes> {
        const reqData = this.buildAxiosReqData(method, headers);
        reqData.url = this.toApiURL(path);

        if (form) {
            const formData = this.convertToMultipart(form);

            Object.assign(reqData.headers, formData.getHeaders());

            reqData.data = formData.toString();
        }

        return JsonUtil.parseLoseless((await Axios.request(reqData)).data);
    }

    protected convertToMultipart(form: RequestForm): FormData {
        const formData = new FormData();

        for (const [ key, value ] of Object.entries(form)) {
            if (value && (value as FileRequestData).value && (value as FileRequestData).options) {
                const file = value as FileRequestData;
                const options: FormData.AppendOptions = { filename: file.options.filename };

                if (file.options.contentType) options.contentType = file.options.contentType;

                formData.append(key, file.value, options);
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