/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient, RequestHeader } from "./web-api-client";
import { Long } from "bson";
import { BasicHeaderDecorator } from "./api-header-decorator";
import { OpenRecommendStruct, OpenPostRecommendStruct } from "../talk/struct/api/open/open-recommend-struct";
import { OpenPresetStruct } from "../talk/struct/api/open/open-preset-struct";
import { OpenPostListStruct, OpenPostReactStruct, OpenPostDataStruct, OpenPostDescStruct, OpenPostApiStruct, OpenPostReactNotiStruct } from "../talk/struct/api/open/open-post-struct";
import { OpenStruct } from "../talk/struct/api/open/open-struct";
import { OpenSearchType, OpenSearchStruct, OpenPostSearchStruct } from "../talk/struct/api/open/open-search-struct";
import { LinkReactionType } from "../talk/struct/open/open-link-struct";
import { JsonUtil } from "../util/json-util";
import { OpenPostTemplate } from "../talk/struct/api/open/template/open-post-template";

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
            this.BasicHeader.fillHeader(header);
        }
    }

    async getCoverPreset(): Promise<OpenPresetStruct> {
        return this.requestMapped('GET', OpenChatClient.getChannelApiPath('link/image/preset'), OpenPresetStruct.MAPPER);
    }

    async requestRecommend(): Promise<OpenRecommendStruct> {
        return this.requestMapped('GET', OpenChatClient.getChannelApiPath('recommend'), OpenRecommendStruct.MAPPER);
    }

    async requestRecommendPostList(): Promise<OpenPostRecommendStruct> {
        return this.requestMapped('GET', OpenChatClient.getProfileApiPath('recommend'), OpenPostRecommendStruct.MAPPER);
    }

    async requestNewReactionList(): Promise<OpenPostReactNotiStruct> {
        return this.requestMapped('GET', OpenChatClient.getProfileApiPath('reacts/newMark'), OpenPostReactNotiStruct.MAPPER);
    }

    async setRecommend(linkId: Long): Promise<OpenStruct> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/recommend?li=${linkId.toString()}`));
    }

    async excludeRecommend(linkId: Long): Promise<OpenStruct> {
        return this.request('GET', OpenChatClient.getChannelApiPath(`search/exclude?li=${linkId.toString()}`));
    }

    async requestPostList(linkId: Long): Promise<OpenPostListStruct> {
        return this.requestMapped('GET', OpenChatClient.getProfileApiPath(`${linkId.toString()}/posts/all`), OpenPostListStruct.MAPPER);
    }

    async getPostFromId(linkId: Long, postId: Long, userLinkId: Long): Promise<OpenPostApiStruct>  {
        return this.requestMapped('GET', OpenChatClient.getProfileApiPath(`${linkId.toString()}/posts/${encodeURIComponent(postId.toString())}?actorLinkId=${encodeURIComponent(userLinkId.toString())}`), OpenPostApiStruct.MAPPER);
    }

    async getPostFromURL(postURL: string, userLinkId: Long): Promise<OpenPostApiStruct>  {
        return this.requestMapped('GET', OpenChatClient.getProfileApiPath(`post?postUrl=${encodeURIComponent(postURL)}&actorLinkId=${encodeURIComponent(userLinkId.toString())}`), OpenPostApiStruct.MAPPER);
    }

    async createPost(userLinkId: Long, template: OpenPostTemplate): Promise<OpenPostApiStruct> {
        let postForm: any = {

            description: template.text

        };
        
        if (template.postDataList) postForm['postDatas'] = JsonUtil.stringifyLoseless(template.postDataList);
        if (template.scrapData) postForm['scrapData'] = JsonUtil.stringifyLoseless(template.scrapData);
        if (template.shareChannelList) postForm['chatIds'] = JsonUtil.stringifyLoseless(template.shareChannelList);

        return this.requestMapped('POST', OpenChatClient.getProfileApiPath(`${encodeURIComponent(userLinkId.toString())}/posts`), OpenPostApiStruct.MAPPER, postForm);
    }

    async updatePost(userLinkId: Long, postId: Long, template: OpenPostTemplate): Promise<OpenPostApiStruct> {
        let postForm: any = {

            description: template.text

        };

        if (template.postDataList) postForm['postDatas'] = JsonUtil.stringifyLoseless(template.postDataList);
        if (template.scrapData) postForm['scrapData'] = JsonUtil.stringifyLoseless(template.scrapData);

        return this.requestMapped('PUT', OpenChatClient.getProfileApiPath(`${encodeURIComponent(userLinkId.toString())}/posts/${encodeURIComponent(postId.toString())}`), OpenPostApiStruct.MAPPER, postForm);
    }

    async deletePost(userLinkId: Long, postId: Long): Promise<OpenStruct> {
        return this.request('DELETE', OpenChatClient.getProfileApiPath(`${encodeURIComponent(userLinkId.toString())}/posts/${encodeURIComponent(postId.toString())}`));
    }

    async reactToPost(linkId: Long, postId: Long, userLinkId: Long): Promise<OpenPostReactStruct> {
        return this.requestMapped('POST', OpenChatClient.getProfileApiPath(`${linkId.toString()}/reacts/${encodeURIComponent(postId.toString())}?type=${LinkReactionType.NORMAL}&actorLinkId=${encodeURIComponent(userLinkId.toString())}`), OpenPostReactStruct.MAPPER);
    }

    async unReactPost(linkId: Long, postId: Long, userLinkId: Long): Promise<OpenStruct> {
        return this.request('DELETE', OpenChatClient.getProfileApiPath(`${linkId.toString()}/reacts/${encodeURIComponent(postId.toString())}?actorLinkId=${encodeURIComponent(userLinkId.toString())}`));
    }

    async searchAll(query: string, searchType: OpenSearchType | null = null, page: number = 1, exceptLock: boolean = false, count: number = 30): Promise<OpenSearchStruct> {
        let queries = `q=${encodeURIComponent(query)}&s=l&p=${encodeURIComponent(page)}&c=${encodeURIComponent(count)}&exceptLock=${exceptLock ? 'Y' : 'N'}`;

        if (searchType) queries += `&resultType=${searchType}`;

        return this.requestMapped('GET', OpenChatClient.getChannelApiPath(`search/unified?${queries}`), OpenSearchStruct.MAPPER);
    }

    async searchPost(query: string, page: number = 1, count: number = 30): Promise<OpenPostSearchStruct> {
        return this.requestMapped('GET', OpenChatClient.getChannelApiPath(`search/post?q=${encodeURIComponent(query)}&p=${encodeURIComponent(page)}&c=${encodeURIComponent(count)}`), OpenPostSearchStruct.MAPPER);
    }

    createJoinLinkURL(code: string, ref: string = 'EW') {
        return `kakaoopen://join?l=${code}&r=${ref}`;
    }

    static getProfileApiPath(api: string) {
        return `profile/${api}`;
    }

    static getChannelApiPath(api: string) {
        return `c/${api}`;
    }

}