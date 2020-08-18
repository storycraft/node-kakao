/*
 * Created on Fri Aug 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EmoticonAttachment } from "../../../../chat/attachment/chat-attachment";
import { PostContents } from "../channel-post-struct";

export interface BoardCommentTemplate {

    text: PostContents;

    emoticon?: EmoticonAttachment;

}