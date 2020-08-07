/*
 * Created on Fri Aug 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EmoticonAttachment } from "../../../../chat/attachment/chat-attachment";
import { Long } from "bson";

export interface CommentContent {

    type: string;

}

export interface CommentText {

    type: 'text',
    text: string;

}

export interface CommentMention {

    type: 'user',
    id: Long;

}

export interface EveryoneMention {

    type: 'user_all'

}

export type CommentContentType = string | CommentText | CommentMention | EveryoneMention;

export interface BoardCommentTemplate {

    text: CommentContentType;

    emoticon?: EmoticonAttachment;

}