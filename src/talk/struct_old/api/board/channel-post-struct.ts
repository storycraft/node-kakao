/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../../struct-base";
import { Long } from "bson";
import { ChannelBoardStruct } from "./channel-board-struct";

export enum PostType {

    TEXT = 'TEXT',
    POLL = 'POLL',
    FILE = 'FILE',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    SCHEDULE = 'SCHEDULE'

}

export enum PostPermission {



}

export enum BoardEmotionType {

    LIKE = 'LIKE'

}

export namespace ChannelPost {

    export enum ContentType {

        TEXT = 'text',
        MENTION = 'user',
        EVERYONE_MENTION = 'user_all'

    }

    export interface Comment extends StructBase {

        id: string;
        content: string;
    
        permission: PostPermission;
    
        owner_id: Long;
        created_at: string;
    
    }

    export interface Emotion {

        id: string;
        emotion: BoardEmotionType;
        owner_id: Long;
        created_at: string;

    }

    

    export enum PollItemType {

        TEXT = 'text',

    }
    
    export interface PollItem {

        id: string;
        title: string;
        voted: boolean;
        user_count: number;

    }

    export interface Poll {

        id: string;

        subject: string;

        secret: boolean;
        closed: boolean;
        voted: boolean;

        items: PollItem[];

        permission: PostPermission;

        item_type: PollItemType;
        item_addable: boolean;
        
        multiSelect: boolean;

        user_count: number;

        post_id: string;
        created_at: string;
    }

    export interface File {

        id: string;
        filename: string;

        size: number;

        ext: string;

        download_url: string;
        repo: string;

        valid_until: Long;

        post_id: string;
        owner_id: Long;
        created_at: string;
    }

    export interface Schedule {

        subject: string;

        start_at: number;
        end_at: number;

        all_day: string;

        location?: string;
        alarm_at?: number;

        ask_attend: boolean;

    }

    export interface Media {

        id: string;
        
        media_type: string;

        small_url?: string;
        medium_url?: string;
        large_url?: string;
        original_url?: string;

        video_download_low_quality_url?: string;
        video_download_high_quality_url?: string;

        video_streaming_low_quality_url?: string;
        video_streaming_high_quality_url?: string;

        valid_until: Long;

        post_id: string;
        owner_id: Long;
        created_at: string;
    }

    export interface Scrap {
        
        url: string;
        canonicalUrl: string;

        contentType: string;

        title: string;
        description: string;
        mainImageUrl: string;

    }

    export interface Text {

        text: string;
        type: ContentType.TEXT;

    }

    export interface Mention {

        type: ContentType.MENTION,
        id: Long;
    
    }

    export interface EveryoneMention {

        type: ContentType.EVERYONE_MENTION
    
    }

}


export type PostContent = ChannelPost.Text | ChannelPost.Mention | ChannelPost.EveryoneMention;

export interface SimpleChannelPostStruct extends StructBase {

    id: string;

    owner_id: Long;

    object_type: PostType;

    created_at: string;

    read_count: number;

    comment_count: number;
    emotion_count: number;

    notice: boolean;

    // bit flag?
    permission: PostPermission;

    // JSON ChannelPost.Text
    content?: string;
    poll?: ChannelPost.Poll;
    files?: ChannelPost.File[];
    media?: ChannelPost.Media;

    // JSON ChannelPost.Scrap
    scrap?: string;

}

export interface ChannelPostStruct extends SimpleChannelPostStruct {

    comments: ChannelPost.Comment[];
    has_more_comments: boolean;
    
    emotions: ChannelPost.Emotion[];
    my_emotion?: ChannelPost.Emotion;

}

type ChannelPostReqMix = ChannelBoardStruct & ChannelPostStruct;
export interface ChannelPostReqStruct extends ChannelPostReqMix {

}