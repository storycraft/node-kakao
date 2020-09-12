/*
 * Created on Sun Aug 09 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelPost, PostType, PostContent } from "../channel-post-struct";
import { EmoticonAttachment } from "../../../../chat/attachment/chat-attachment";

export interface BoardPostTemplate<T = PostType> {

    object_type: T;

    content?: PostContent[] | string;

    emoticon?: EmoticonAttachment;

    scrap?: ChannelPost.Scrap;

    notice: boolean;
    
}

export type BoardPostFileMap = { [name: string]: string };

export interface BoardTextPostTemplate extends BoardPostTemplate<PostType.TEXT> {



}

export interface BoardImagePostTemplate extends BoardPostTemplate<PostType.IMAGE> {

    images: BoardPostFileMap;

}

export interface BoardVideoPostTemplate extends BoardPostTemplate<PostType.VIDEO> {

    vidoes: BoardPostFileMap;

}

export interface BoardFilePostTemplate extends BoardPostTemplate<PostType.FILE> {

    files: BoardPostFileMap;

}

export interface BoardPollPostTemplate extends BoardPostTemplate<PostType.POLL> {

    poll_content: ChannelPost.Poll;

}

export interface BoardSchedulePostTemplate extends BoardPostTemplate<PostType.SCHEDULE> {

    schedule_content: ChannelPost.Schedule;

}

export type BoardPostTemplates = BoardTextPostTemplate | BoardImagePostTemplate | BoardVideoPostTemplate | BoardFilePostTemplate | BoardPollPostTemplate | BoardSchedulePostTemplate;