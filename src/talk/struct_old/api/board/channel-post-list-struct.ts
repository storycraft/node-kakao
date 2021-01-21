/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { SimpleChannelPostStruct } from "./channel-post-struct";

export interface ChannelPostListStruct extends WebApiStruct {

    posts: SimpleChannelPostStruct[];
    
    has_more: boolean;

}