/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../talk/struct/web-api-struct";
import { JsonUtil } from "../util/json-util";
import * as request from "request-promise";
import { BasicHeaderDecorator, ApiHeaderDecorator, AHeaderDecorator } from "./api-header-decorator";
import { AccessDataProvider } from "../oauth/access-data-provider";

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

    async request<T extends WebApiStruct>(method: string, path: string, form: RequestForm | null = null, headers: RequestHeader | null = null): Promise<T> {
        let reqHeader = this.createClientHeader();
        this.fillHeader(reqHeader);

        let reqData: request.RequestPromiseOptions = {
            headers: reqHeader,
            method: method
        };

        if (headers) Object.assign(reqHeader, headers);
        if (form) reqData.form = form;

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