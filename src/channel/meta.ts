/*
 * Created on Fri Jun 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelMetaType } from '../packet/struct';

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

export interface ChannelMetaStruct {

    type: ChannelMetaType,
    revision: Long,
    authorId?: Long,
    content: string,
    updatedAt: number

}

export interface ChannelClientMetaStruct {

    name?: string;
    // eslint-disable-next-line camelcase
    image_path?: string;
    favorite?: boolean,
    // eslint-disable-next-line camelcase
    push_sound?: boolean,
    // eslint-disable-next-line camelcase
    chat_hide?: boolean,
    fullImageUrl?: string;
    imageUrl?: string;

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MetaContent {


}

export interface PrivilegeMetaContent {

    // eslint-disable-next-line camelcase
    pin_notice: boolean;

}

export interface ProfileMetaContent {

    imageUrl: string;
    fullImageUrl: string;

}

export interface TvMetaContent {

    url: string;

}

export interface TvLiveMetaContent {

    url: string;
    live?: 'on';

}

export interface LiveTalkCountMetaContent {

    count: number;

}

export interface GroupMetaContent {

    // eslint-disable-next-line camelcase
    group_id: number;
    // eslint-disable-next-line camelcase
    group_name: string;
    // eslint-disable-next-line camelcase
    group_profile_thumbnail_url: string;
    // eslint-disable-next-line camelcase
    group_profile_url: string;

}

export interface BotCommandStruct {

    id: string;

}

export interface BotAddCommandStruct extends BotCommandStruct {

    name: string;

    updatedAt: number;

    botId: Long;

}

export type BotDelCommandStruct = BotCommandStruct

export interface BotMetaContent {

    add?: BotAddCommandStruct[];
    update?: BotAddCommandStruct[];
    full?: BotAddCommandStruct[];
    del?: BotDelCommandStruct[];

}
