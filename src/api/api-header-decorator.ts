/*
 * Created on Tue Jun 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { RequestHeader } from "./web-api-client";
import { Configuration } from "../configuration";

export interface ApiHeaderDecorator {

    fillHeader(header: RequestHeader): void;

}

export class BasicHeaderDecorator implements ApiHeaderDecorator {

    static readonly INSTANCE = new BasicHeaderDecorator();

    private constructor() {

    }

    get Language() {
        return Configuration.Language;
    }

    get UserAgent() {
        return `KT/${Configuration.Version} Wd/${Configuration.OSVersion} ${Configuration.Language}`;
    }

    fillHeader(header: RequestHeader) {
        header['Accept'] = '*/*';
        header['Accept-Language'] = this.Language;
        header['User-Agent'] = this.UserAgent;
    }

}

export class AHeaderDecorator implements ApiHeaderDecorator {

    static readonly INSTANCE = new AHeaderDecorator();

    private constructor() {

    }

    fillHeader(header: RequestHeader) {
        header['A'] = `${Configuration.Agent}/${Configuration.Version}/${Configuration.Language}`;
    }

}

export class CHeaderDecorator implements ApiHeaderDecorator {

    constructor() {

    }

    fillHeader(header: RequestHeader) {
        //header['C'] = uuid;
    }

}