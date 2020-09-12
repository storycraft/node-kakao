/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import Axios, { AxiosRequestConfig } from "axios";
import * as FormData from "form-data";
import { ObjectMapper, Serializer } from "json-proxy-mapper";
import { URLSearchParams } from "url";
import { ClientConfigProvider } from "../config/client-config-provider";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { StructBase, StructType } from "../talk/struct/struct-base";
import { JsonUtil } from "../util/json-util";
import { ApiHeaderDecorator, BasicHeaderDecorator } from "./api-header-decorator";

export type RequestForm = { [key: string]: FileRequestData | StructType };
export type FileRequestData = { value: Buffer, options: { filename: string, contentType?: string } };
export type RequestHeader = { [key: string]: any };
export type Method = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'LINK' | 'UNLINK';

export abstract class WebApiClient implements ApiHeaderDecorator {

    private basicHeader: BasicHeaderDecorator;

    constructor(private configProvider: ClientConfigProvider) {
        this.basicHeader = new BasicHeaderDecorator(configProvider);
    }

    get ConfigProvider() {
        return this.configProvider;
    }

    get BasicHeader() {
        return this.basicHeader;
    }

    protected createClientHeader(): RequestHeader {
        return { 'Host': this.Host };
    }

    fillHeader(header: RequestHeader) {
        this.basicHeader.fillHeader(header);
    }

    abstract get Scheme(): string;

    abstract get Host(): string;

    toApiURL(path: string) {
        return `${this.Scheme}://${this.Host}/${path}`;
    }

    protected buildRequestData(method: Method, headers: RequestHeader | null = null): AxiosRequestConfig {
        let reqHeader = this.createClientHeader();
        this.fillHeader(reqHeader);

        let reqData: AxiosRequestConfig = {
            headers: reqHeader,
            
            method: method,

            // https://github.com/axios/axios/issues/811
            // https://github.com/axios/axios/issues/907
            transformResponse: (data) => { return data; },

            responseType: 'text'
        };

        if (headers) Object.assign(reqHeader, headers);

        return reqData;
    }

    async request<T extends StructBase>(method: Method, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);
        reqData.url = this.toApiURL(path);

        if (form) {
            let formData = this.convertToFormData(form);

            reqData.data = formData;
        }

        let res = JsonUtil.parseLoseless((await Axios.request(reqData)).data);

        return res;
    }

    async requestMapped<T extends StructBase>(method: Method, path: string, mapper: ObjectMapper, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let rawRes = await this.request(method, path, form, headers);

        let res = Serializer.deserialize<T>(rawRes, mapper);

        return res;
    }

    async requestMultipart<T extends StructBase>(method: Method, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);
        reqData.url = this.toApiURL(path);

        if (form) {
            let formData = this.convertToMultipart(form);

            Object.assign(formData.getHeaders(), reqData.headers);

            reqData.data = formData;
        }

        let res = JsonUtil.parseLoseless((await Axios.request(reqData)).data);

        return res;
    }

    protected convertToMultipart(form: RequestForm): FormData {
        let formData = new FormData();

        let entries = Object.entries(form);
        for (let [ key, value ] of entries) {
            if (value && (value as FileRequestData).value && (value as FileRequestData).options) {
                let file = value as FileRequestData;
                let options: FormData.AppendOptions = { filename: file.options.filename };
                
                if (file.options.contentType) options.contentType = file.options.contentType;

                formData.append(key, file.value, options);
            } else {
                formData.append(key, value + '');
            }
        }

        return formData;
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

export abstract class SessionApiClient extends WebApiClient {

    constructor(private provider: AccessDataProvider, configProvider: ClientConfigProvider) {
        super(configProvider);
    }

    fillHeader(header: RequestHeader) {
        super.fillHeader(header);

        this.provider.fillSessionHeader(header);
    }

}