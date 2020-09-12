/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { ChannelPost } from "./channel-post-struct";

export interface ChannelPostCommentStruct extends WebApiStruct {

    comments: ChannelPost.Comment[];

}