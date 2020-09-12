/*
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionApiClient, RequestForm } from "./web-api-client";
import { Long } from "bson";
import { ChannelPostListStruct } from "../talk/struct/api/board/channel-post-list-struct";
import { ChannelPostReqStruct, BoardEmotionType, PostContent, ChannelPost, PostType } from "../talk/struct/api/board/channel-post-struct";
import { ChannelPostCommentStruct } from "../talk/struct/api/board/channel-post-comment-struct";
import { ChannelPostEmotionStruct } from "../talk/struct/api/board/channel-post-emotion-struct";
import { ChannelBoardStruct } from "../talk/struct/api/board/channel-board-struct";
import { BoardCommentTemplate } from "../talk/struct/api/board/template/board-comment-template";
import { JsonUtil } from "../util/json-util";
import { WebApiStruct } from "../talk/struct/web-api-struct";
import { BoardPostTemplates, BoardPostFileMap } from "../talk/struct/api/board/template/board-post-template";

export abstract class BaseBoardClient extends SessionApiClient {

    protected fillCommentForm(form: RequestForm, content: BoardCommentTemplate | string) {
        let contentList: PostContent[] = [];

        if (typeof(content) === 'string') {
            contentList.push({ type: 'text', text: content } as ChannelPost.Text);
        } else {
            if (typeof(content.text) === 'string') {
                contentList.push({ type: 'text', text: content.text } as ChannelPost.Text);
            } else if (content.text && content.text instanceof Array) {
                contentList.push(...content.text);
            }

            if (content.emoticon) form['sticon'] = JsonUtil.stringifyLoseless(content.emoticon.toJsonAttachment());
        }

        form['content'] = JsonUtil.stringifyLoseless(contentList);
    }

    protected fillFileMap(form: RequestForm, type: PostType, fileMap: BoardPostFileMap) {
        form['original_file_names[]'] = Object.keys(fileMap);
        form[`${type.toLowerCase()}_paths[]`] = Object.values(fileMap);
    }

    protected fillPostForm(form: RequestForm, template: BoardPostTemplates) {
        form['object_type'] = template.object_type;

        if (template.content) {
            let contentList: PostContent[] = [];

            if (typeof(template.content) === 'string') contentList.push({ text: template.content, type: ChannelPost.ContentType.TEXT } as ChannelPost.Text);
            else if (template.content instanceof Array) contentList.push(...template.content);

            form['content'] = JsonUtil.stringifyLoseless(contentList);
        }

        if (template.object_type === PostType.POLL && template.poll_content) form['poll_content'] = JsonUtil.stringifyLoseless(template.poll_content);

        if (template.object_type === PostType.IMAGE) this.fillFileMap(form, PostType.IMAGE, template.images);
        else if (template.object_type === PostType.VIDEO) this.fillFileMap(form, PostType.VIDEO, template.vidoes);
        else if (template.object_type === PostType.FILE) this.fillFileMap(form, PostType.FILE, template.files);
        else if (template.object_type === PostType.SCHEDULE) form['schedule_content'] = JsonUtil.stringifyLoseless(template.schedule_content);

        if (template.emoticon) form['sticon'] = JsonUtil.stringifyLoseless(template.emoticon.toJsonAttachment());
        
        if (template.scrap) form['scrap'] = JsonUtil.stringifyLoseless(template.scrap);

        form['notice'] = template.notice;
    }

}

export class ChannelBoardClient extends BaseBoardClient {

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
        let form: RequestForm = {};

        this.fillCommentForm(form, content);

        return this.request('POST', `posts/${postId}/comments`, form);
    }

    async deleteComment(postId: string, commentId: string): Promise<ChannelPostReqStruct> {
        return this.request('DELETE', `posts/${postId}/comments/${commentId}`);
    }

    async createPost(channelId: Long, template: BoardPostTemplates): Promise<ChannelPostReqStruct> {
        let form: RequestForm = {};

        this.fillPostForm(form, template);

        return this.request('POST', `chats/${channelId.toString()}/posts`, form);
    }

    async updatePost(postId: string, template: BoardPostTemplates): Promise<ChannelPostReqStruct> {
        let form: RequestForm = {};

        this.fillPostForm(form, template);

        return this.request('PUT', `posts/${postId}`, form);
    }

    async deletePost(postId: string): Promise<WebApiStruct> {
        return this.request('DELETE', `posts/${postId}`);
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

export class OpenChannelBoardClient extends BaseBoardClient {

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
        let form: RequestForm = {};

        this.fillCommentForm(form, content);

        return this.request('POST', this.toOpenApiPath(linkId, `posts/${postId}/comments`), form);
    }

    async deleteComment(linkId: Long, postId: string, commentId: string): Promise<ChannelPostReqStruct> {
        return this.request('DELETE', this.toOpenApiPath(linkId, `posts/${postId}/comments/${commentId}`));
    }

    async createPost(linkId: Long, channelId: Long, template: BoardPostTemplates): Promise<ChannelPostReqStruct> {
        let form: RequestForm = {};

        this.fillPostForm(form, template);

        return this.request('POST', this.toOpenApiPath(linkId, `chats/${channelId.toString()}/posts`), form);
    }

    async updatePost(linkId: Long, postId: string, template: BoardPostTemplates): Promise<ChannelPostReqStruct> {
        let form: RequestForm = {};

        this.fillPostForm(form, template);

        return this.request('PUT', this.toOpenApiPath(linkId, `posts/${postId}`), form);
    }

    async deletePost(linkId: Long, postId: string): Promise<WebApiStruct> {
        return this.request('DELETE', this.toOpenApiPath(linkId, `posts/${postId}`));
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