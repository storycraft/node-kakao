/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ApiStruct } from "../talk/struct/api/api-struct";
import { JsonUtil } from "../util/json-util";
import * as request from "request-promise";
import { BasicHeaderDecorator, ApiHeaderDecorator } from "./api-header-decorator";

export type RequestForm = { [key: string]: any };
export type RequestHeader = { [key: string]: any };

export abstract class WebApiClient implements ApiHeaderDecorator {

    protected createClientHeader(): RequestHeader {
        return { 'Host': this.Host };
    }

    fillHeader(header: RequestHeader) {
        BasicHeaderDecorator.INSTANCE.fillHeader(header);
    }

    abstract get Host(): string;

    toApiURL(path: string) {
        return `${this.Host}/${path}`;
    }

    async request<T extends ApiStruct>(method: string, path: string, form?: RequestForm): Promise<T> {
        let reqHeader = this.createClientHeader();
        this.fillHeader(reqHeader);

        let reqData: request.RequestPromiseOptions = {
            headers: reqHeader,
            method: method
        };

        if (form) reqData.form = form;

        let res = JsonUtil.parseLoseless(await request(this.toApiURL(path), reqData));

        return res;
    }

}