/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient, RequestForm } from "./web-api-client";
import { Long } from "bson";
import { ChannelPostListStruct } from "../talk/struct/api/board/channel-post-list-struct";
import { ChannelPostReqStruct, BoardEmotionType, PostContents, ChannelPost } from "../talk/struct/api/board/channel-post-struct";
import { ChannelPostCommentStruct } from "../talk/struct/api/board/channel-post-comment-struct";
import { ChannelPostEmotionStruct } from "../talk/struct/api/board/channel-post-emotion-struct";
import { ChannelBoardStruct } from "../talk/struct/api/board/channel-board-struct";
import { BoardCommentTemplate } from "../talk/struct/api/board/template/board-comment-template";
import { JsonUtil } from "../util/json-util";

export class ChannelBoardClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'talkmoim-api.kakao.com';
    }

    async requestPostList(channelId: Long): Promise<ChannelPostListStruct> {
        return this.request('GET', `chats/${channelId.toString()}/posts`);
    }

    async getPost(postId: string): Promise<ChannelPostReqStruct> {
        return this.request('GET', `posts/${postId}`);
    }

    async getPostEmotionList(postId: string): Promise<ChannelPostEmotionStruct> {
        return this.request('GET', `posts/${postId}/emotions`);
    }

    async getPostCommentList(postId: string): Promise<ChannelPostCommentStruct> {
        return this.request('GET', `posts/${postId}/comments`);
    }

    async reactToPost(postId: string): Promise<ChannelPostReqStruct> {
        return this.request('POST', `posts/${postId}/emotions`, { emotion: BoardEmotionType.LIKE });
    }

    async unreactPost(postId: string, reactionId: string): Promise<ChannelPostReqStruct> {
        return this.request('DELETE', `posts/${postId}/emotions/${reactionId}`);
    }

    async commentToPost(postId: string, content: BoardCommentTemplate | string): Promise<ChannelPostReqStruct> {
        let contentList: PostContents[] = [];

        let form: RequestForm = {};
        
        if (typeof(content) === 'string') {
            contentList.push({ type: 'text', text: content } as ChannelPost.Text);
        } else {
            if (typeof(content.text) === 'string') {
                contentList.push({ type: 'text', text: content.text } as ChannelPost.Text);
            } else if (content.text && content.text instanceof Array) {
                contentList.push(...content.text);
            }

            if (content.emoticon) form['sticon'] = content.emoticon.toJsonAttachment();
        }

        form['content'] = JsonUtil.stringifyLoseless(contentList);

        return this.request('POST', `posts/${postId}/comments`, form);
    }

    async deleteComment(postId: string, commentId: string): Promise<ChannelPostReqStruct> {
        return this.request('DELETE', `posts/${postId}/comments/${commentId}`);
    }

    async setPostNotice(postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', `posts/${postId}/set_notice`);
    }

    async unsetPostNotice(postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', `posts/${postId}/unset_notice`);
    }

    async sharePostToChannel(postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', `posts/${postId}/share`);
    }

}

export class OpenChannelBoardClient extends SessionApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'open.kakao.com';
    }

    async requestPostList(linkId: Long, channelId: Long): Promise<ChannelPostListStruct> {
        return this.request('GET', this.toOpenApiPath(linkId, `chats/${channelId.toString()}/posts`));
    }

    async getPost(linkId: Long, postId: string): Promise<ChannelPostReqStruct> {
        return this.request('GET', this.toOpenApiPath(linkId, `posts/${postId}`));
    }

    async getPostEmotionList(linkId: Long, postId: string): Promise<ChannelPostEmotionStruct> {
        return this.request('GET', this.toOpenApiPath(linkId, `posts/${postId}`));
    }

    async getPostCommentList(linkId: Long, postId: string): Promise<ChannelPostCommentStruct> {
        return this.request('GET', this.toOpenApiPath(linkId, `posts/${postId}/comments`));
    }

    async reactToPost(linkId: Long, postId: string): Promise<ChannelPostReqStruct> {
        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/emotions`), { emotion: BoardEmotionType.LIKE });
    }

    async unreactPost(linkId: Long, postId: string, reactionId: string): Promise<ChannelPostReqStruct> {
        // they don't check reactionId ok
        return this.request('DELETE', this.toOpenApiPath(linkId, `posts/${postId}/emotions/${reactionId}`));
    }

    async commentToPost(linkId: Long, postId: string, content: BoardCommentTemplate | string): Promise<ChannelPostReqStruct> {
        let contentList: PostContents[] = [];

        let form: RequestForm = {};
        
        if (typeof(content) === 'string') {
            contentList.push({ type: 'text', text: content } as ChannelPost.Text);
        } else {
            if (typeof(content.text) === 'string') {
                contentList.push({ type: 'text', text: content.text } as ChannelPost.Text);
            } else if (content.text && content.text instanceof Array) {
                contentList.push(...content.text);
            }

            if (content.emoticon) form['sticon'] = content.emoticon.toJsonAttachment();
        }

        form['content'] = JsonUtil.stringifyLoseless(contentList);

        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/comments`), form);
    }

    async deleteComment(linkId: Long, postId: string, commentId: string): Promise<ChannelPostReqStruct> {
        return this.request('DELETE', this.toOpenApiPath(linkId, `posts/${postId}/comments/${commentId}`));
    }

    async setPostNotice(linkId: Long, postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/set_notice`));
    }

    async unsetPostNotice(linkId: Long, postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/unset_notice`));
    }

    async sharePostToChannel(linkId: Long, postId: string): Promise<ChannelBoardStruct> {
        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/share`));
    }

    toOpenApiPath(linkId: Long, path: string) {
        return `moim/${path}?link_id=${linkId.toString()}`;
    }

}