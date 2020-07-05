/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient, RequestHeader } from "./web-api-client";
import { Long } from "bson";
import { BasicHeaderDecorator } from "./api-header-decorator";
import { OpenRecommendStruct } from "../talk/struct/api/open/open-recommend-struct";
import { OpenPresetStruct } from "../talk/struct/api/open/open-preset-struct";
import { OpenPostListStruct } from "../talk/struct/api/open/open-post-struct";
import { OpenStruct } from "../talk/struct/api/open/open-struct";
import { OpenSearchType } from "../talk/struct/api/open/open-search-struct";

export class OpenChatClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'open.kakao.com';
    }

    fillHeader(header: RequestHeader) {
        try {
            super.fillHeader(header);
        } catch (e) { // try without auth
            BasicHeaderDecorator.INSTANCE.fillHeader(header);
        }
    }

    async getCoverPreset(): Promise<OpenPresetStruct> {
        return this.requestMapped('GET', OpenChatClient.getChannelApiPath('link/image/preset'), OpenPresetStruct.MAPPER);
    }

    async requestRecommend(): Promise<OpenRecommendStruct> {
        return this.requestMapped('GET', OpenChatClient.getChannelApiPath('recommend'), OpenRecommendStruct.MAPPER);
    }

    async setRecommend(linkId: Long): Promise<OpenStruct> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/recommend?li=${encodeURIComponent(linkId.toString())}`));
    }

    async excludeRecommend(linkId: Long): Promise<OpenStruct> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/exclude?li=${encodeURIComponent(linkId.toString())}`));
    }

    async requestPostList(linkId: Long): Promise<OpenPostListStruct> {
        return this.request('GET', OpenChatClient.getProfileApiPath(`${encodeURIComponent(linkId.toString())}/posts/all`));
    }

    async searchAll(query: string, searchType: OpenSearchType | null = null, page: number = 1, exceptLock: boolean = false, count: number = 30): Promise<unknown> {
        let queries = `q=${encodeURIComponent(query)}&s=l&p=${encodeURIComponent(page)}&c=${encodeURIComponent(count)}&exceptLock=${exceptLock ? 'Y' : 'N'}`;

        if (searchType) queries += `&resultType=${searchType}`;

        return this.request('GET', OpenChatClient.getChannelApiPath(`search/unified?${queries}`));
    }

    async searchPost(query: string, page: number = 0, count: number = 30): Promise<unknown> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/post?q=${encodeURIComponent(query)}&p=${encodeURIComponent(page)}&c=${encodeURIComponent(count)}`));
    }

    static getProfileApiPath(api: string) {
        return `profile/${api}`;
    }

    static getChannelApiPath(api: string) {
        return `c/${api}`;
    }

}