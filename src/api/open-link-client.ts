/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient } from "./web-api-client";
import { Long } from "bson";

export class OpenLinkClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'open.kakao.com';
    }

    async getLinkPreset(): Promise<unknown> {
        return this.request('GET', OpenLinkClient.getChannelApiPath('link/image/preset'));
    }

    async requestRecommend(): Promise<unknown> {
        return this.request('GET', OpenLinkClient.getChannelApiPath('recommend'));
    }

    async requestPostList(linkId: Long): Promise<unknown> {
        return this.request('GET', OpenLinkClient.getProfileApiPath(`${encodeURIComponent(linkId.toString())}/posts/all`));
    }

    async searchLink(query: string): Promise<unknown> {
        return this.request('GET', OpenLinkClient.getChannelApiPath(`search/unified?q=${encodeURIComponent(query)}`));
    }

    static getProfileApiPath(api: string) {
        return `profile/${api}`;
    }

    static getChannelApiPath(api: string) {
        return `c/${api}`;
    }

}