/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";
import { Long } from "bson";
import { BotAddCommandStruct, BotDelCommandStruct } from "./bot/bot-command-struct";

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
    LIVE_TALK_COUNT = 12,
    OPEN_CHANNEL_CHAT = 13,
    BOT = 14,
    

}

export enum ChannelClientMetaType {
    
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
    authorId?: Long,
    content: string,
    updatedAt: number

}

export interface ChannelClientMetaStruct extends StructBase {

    name?: string;
    image_path?: string;
    favorite?: boolean,
    push_sound?: boolean,
    chat_hide?: boolean,
    fullImageUrl?: string;
    imageUrl?: string;

}

export interface MetaContent extends StructBase {



}

export interface PrivilegeMetaContent extends StructBase {

    pin_notice: boolean;

}

export interface ProfileMetaContent extends StructBase {

    imageUrl: string;
    fullImageUrl: string;

}

export interface TvMetaContent extends StructBase {

    url: string;

}

export interface TvLiveMetaContent extends StructBase {

    url: string;
    live?: "on";

}

export interface LiveTalkCountMetaContent extends StructBase {

    count: number;

}

export interface GroupMetaContent extends StructBase {

    group_id: number;
    group_name: string;
    group_profile_thumbnail_url: string;
    group_profile_url: string;

}

export interface BotMetaContent extends StructBase {

    add?: BotAddCommandStruct[];
    update?: BotAddCommandStruct[];
    full?: BotAddCommandStruct[];
    del?: BotDelCommandStruct[];

}
