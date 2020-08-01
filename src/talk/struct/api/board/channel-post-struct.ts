/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../../struct-base";
import { Long } from "bson";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { WebApiStruct } from "../../web-api-struct";

export enum PostType {

    TEXT = 'TEXT',
    POLL = 'POLL',
    FILE = 'FILE',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'


}

export enum PostPermission {



}

export namespace ChannelPost {

    export enum TextType {

        TEXT = 'text'

    }

    export interface Comment extends StructBase {

        id: string;
        content: string;
    
        permission: PostPermission;
    
        owner_id: Long;
        created_at: string;
    
    }

    export enum EmotionType {

        LIKE = 'LIKE'

    }

    export interface Emotion {

        id: string;
        emotion: EmotionType;
        owner_id: Long;
        created_at: string;

    }

    

    export enum PollItemType {

        TEXT = 'text'

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

    export interface Text {

        text: string;
        type: TextType;

    }

}

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

}

export interface ChannelPostStruct extends SimpleChannelPostStruct {

    comments: ChannelPost.Comment[];
    has_more_comments: boolean;
    
    emotions: ChannelPost.Emotion[];

}

export interface ChannelPostReqStruct extends WebApiStruct, ChannelPostStruct {

}