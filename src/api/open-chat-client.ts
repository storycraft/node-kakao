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

    async requestPostList(linkId: Long): Promise<OpenPostListStruct> {
        return this.request('GET', OpenChatClient.getProfileApiPath(`${encodeURIComponent(linkId.toString())}/posts/all`));
    }

    async searchLink(query: string): Promise<unknown> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/unified?q=${encodeURIComponent(query)}`));
    }

    static getProfileApiPath(api: string) {
        return `profile/${api}`;
    }

    static getChannelApiPath(api: string) {
        return `c/${api}`;
    }

}