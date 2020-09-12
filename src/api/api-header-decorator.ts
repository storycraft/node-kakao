/*
 * Created on Tue Jun 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration } from "../config/client-config";
import { RequestHeader } from "./web-api-client";
import { ClientConfigProvider, DefaultClientConfigProvider } from "../config/client-config-provider";

export interface ApiHeaderDecorator {

    fillHeader(header: RequestHeader): void;

}

export class BasicHeaderDecorator implements ApiHeaderDecorator {

    static readonly INSTANCE = new BasicHeaderDecorator(new DefaultClientConfigProvider());

    constructor(private configProvider: ClientConfigProvider) {

    }

    get UserAgent() {
        return `KT/${this.configProvider.Configuration.version} Wd/${this.configProvider.Configuration.osVersion} ${this.configProvider.Configuration.language}`;
    }

    fillHeader(header: RequestHeader) {
        header['Accept'] = '*/*';
        header['Accept-Language'] = this.configProvider.Configuration.language;
        header['User-Agent'] = this.UserAgent;
    }

}

export class AHeaderDecorator implements ApiHeaderDecorator {

    static readonly INSTANCE = new AHeaderDecorator(new DefaultClientConfigProvider());

    constructor(private configProvider: ClientConfigProvider) {

    }

    fillHeader(header: RequestHeader) {
        header['A'] = `${this.configProvider.Configuration.agent}/${this.configProvider.Configuration.version}/${this.configProvider.Configuration.language}`;
    }

}

export class CHeaderDecorator implements ApiHeaderDecorator {

    constructor() {

    }

    fillHeader(header: RequestHeader) {
        //header['C'] = uuid;
    }

}