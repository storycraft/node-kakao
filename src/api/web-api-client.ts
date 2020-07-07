/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { JsonUtil } from "../util/json-util";
import fetch, { RequestInit } from "node-fetch";
import * as FormData from "form-data";
import { BasicHeaderDecorator, ApiHeaderDecorator, AHeaderDecorator } from "./api-header-decorator";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { ObjectMapper, Serializer } from "json-proxy-mapper";
import { StructBase, StructType } from "../talk/struct/struct-base";
import { URLSearchParams } from "url";

export type RequestForm = { [key: string]: FileRequestData | StructType };
export type FileRequestData = { value: Buffer, options: { filename: string, contentType?: string } };
export type RequestHeader = { [key: string]: any };

export abstract class WebApiClient implements ApiHeaderDecorator {

    protected createClientHeader(): RequestHeader {
        return { 'Host': this.Host };
    }

    fillHeader(header: RequestHeader) {
        BasicHeaderDecorator.INSTANCE.fillHeader(header);
    }

    abstract get Scheme(): string;

    abstract get Host(): string;

    toApiURL(path: string) {
        return `${this.Scheme}://${this.Host}/${path}`;
    }

    protected buildRequestData(method: string, headers: RequestHeader | null = null): RequestInit {
        let reqHeader = this.createClientHeader();
        this.fillHeader(reqHeader);

        let reqData: RequestInit = {
            headers: reqHeader,
            
            method: method
        };

        if (headers) Object.assign(reqHeader, headers);

        return reqData;
    }

    async request<T extends StructBase>(method: string, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);

        if (form) {
            let formData = this.convertToFormData(form);

            reqData.body = formData;
        }

        let res = JsonUtil.parseLoseless(await (await fetch(this.toApiURL(path), reqData)).text());

        return res;
    }

    async requestMapped<T extends StructBase>(method: string, path: string, mapper: ObjectMapper, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let rawRes = await this.request(method, path, form, headers);

        let res = Serializer.deserialize<T>(rawRes, mapper);

        return res;
    }

    async requestMultipart<T extends StructBase>(method: string, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);

        if (form) {
            let formData = this.convertToMultipart(form);

            Object.assign(formData.getHeaders(), reqData.headers);

            reqData.body = formData;
        }

        let res = JsonUtil.parseLoseless(await (await fetch(this.toApiURL(path), reqData)).text());

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

    constructor(private provider: AccessDataProvider) {
        super();
    }

    fillHeader(header: RequestHeader) {
        super.fillHeader(header);

        this.provider.fillSessionHeader(header);
    }

}