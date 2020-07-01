/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient } from "./web-api-client";

export class OpenLinkClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'open.kakao.com';
    }

    static getProfileApiPath(api: string) {
        return `profile/${api}`;
    }

    static getChannelApiPath(api: string) {
        return `c/${api}`;
    }

}