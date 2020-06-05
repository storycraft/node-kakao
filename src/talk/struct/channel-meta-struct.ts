/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";
import { Long } from "bson";

export enum ChannelMetaType {
    
    UNDEFINED = 0,
    NOTICE = 1,
    GROUP = 2,
    TITLE = 3,
    PROFILE = 4,
    TV = 5,
    PRIVILEGE = 6,
    TV_LIVE = 7,
    PLUS_BACKGROUND = 8,
    LIVE_TALK_INFO = 11,
    LIVE_TALK_COUNT = 12

}

export enum ChannelPrivateMetaType {
    
    UNDEFINED = 'undefined',
    NAME = 'name',
    IMAGE_PATH = 'image_path',
    FAVORITE = 'favorite',
    PUSH_SOUND = 'push_sound',
    CHAT_HIDE = 'chat_hide',
    FULL_IMAGE_URL = 'full_image_url',
    IMAGE_URL = 'imageUrl'

}

export interface ChannelMetaStruct extends StructBase {

    type: ChannelMetaType,
    revision: Long,
    authorId: Long,
    content: string,
    updatedAt: number

}