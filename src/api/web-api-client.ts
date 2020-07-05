/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { JsonUtil } from "../util/json-util";
import * as request from "request-promise";
import { BasicHeaderDecorator, ApiHeaderDecorator, AHeaderDecorator } from "./api-header-decorator";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { ObjectMapper, Serializer } from "json-proxy-mapper";
import { StructBase } from "../talk/struct/struct-base";

export type RequestForm = { [key: string]: any };
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

    protected buildRequestData(method: string, headers: RequestHeader | null = null): request.RequestPromiseOptions {
        let reqHeader = this.createClientHeader();
        this.fillHeader(reqHeader);

        let reqData: request.RequestPromiseOptions = {
            headers: reqHeader,
            method: method
        };

        if (headers) Object.assign(reqHeader, headers);

        return reqData;
    }

    async request<T extends StructBase>(method: string, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);
        if (form) reqData.form = form;

        let res = JsonUtil.parseLoseless(await request(this.toApiURL(path), reqData));

        return res;
    }

    async requestMapped<T extends StructBase>(method: string, path: string, mapper: ObjectMapper, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let rawRes = await this.request(method, path, form, headers);

        let res = Serializer.deserialize<T>(rawRes, mapper);

        return res;
    }

    async requestMultipart<T extends StructBase>(method: string, path: string, formData: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqData = this.buildRequestData(method, headers);
        if (formData) reqData.formData = formData;

        let res = JsonUtil.parseLoseless(await request(this.toApiURL(path), reqData));

        return res;
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