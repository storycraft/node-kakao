/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Configuration } from "../configuration";
import { WebApiStruct } from "../talk/struct/web-api-struct";
import { SessionApiClient } from "./web-api-client";

export class ScrapClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'sb-talk.kakao.com';
    }

    async getPreviewURL(url: string): Promise<WebApiStruct> {
        return this.request('POST', ScrapClient.getScrapApiPath('preview.json'), { url: url });
    }

    static getScrapApiPath(api: string) {
        return `${Configuration.Agent}/scrap/${api}`;
    }

}
