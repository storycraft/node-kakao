/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog } from '../chat/chat';
import { DisplayUserInfo } from '../user/channel-user-info';
import { Channel } from './channel';
import { ChannelType } from './channel-type';

export interface ChannelMeta {

    content: string;

}

export interface SetChannelMeta extends ChannelMeta {

    revision: number;

    authorId: Long;

    updatedAt: number;

}

export type ChannelMetaMap = Record<ChannelType, SetChannelMeta>

/**
 * Common channel info
 */
export interface ChannelInfo extends Channel {

    /**
     * Channel type
     */
    type: ChannelType;

    /**
     * Active user count
     */
    activeUserCount: number;

    /**
     * Unread chat count
     */
    newChatCount: number;

    /**
     * true if new chat count is invalid
     */
    newChatCountInvalid: boolean;

    /**
     * Last chat log id
     */
    lastChatLogId: Long;

    /**
     * Last seen chat log id
     */
    lastSeenLogId: Long;

    /**
     * Last chatlog
     */
    lastChatLog?: Chatlog;

    // clientMeta?: ChannelClientMetaStruct;

    metaMap: ChannelMetaMap;

    displayUserList: DisplayUserInfo[];

    /**
     * Push alert settings
     */
    pushAlert: boolean;

}

export namespace ChannelInfo {

    export function createPartial(info: Partial<ChannelInfo>): ChannelInfo {
      return Object.assign({
        channelId: Long.ZERO,

        type: '',

        activeUserCount: 0,

        newChatCount: 0,
        newChatCountInvalid: true,

        lastChatLogId: Long.ZERO,
        lastSeenLogId: Long.ZERO,

        displayUserList: [],

        metaMap: {},

        pushAlert: false,
      }, info);
    }

}

/**
 * Normal channel info
 */
export interface NormalChannelInfo extends ChannelInfo {

    /**
     * Channel join time (js Date timestamp)
     */
    joinTime: number;

}

export namespace NormalChannelInfo {

    export function createPartial(info: Partial<NormalChannelInfo>): NormalChannelInfo {
      return Object.assign({
        ...ChannelInfo.createPartial(info),
        joinTime: 0,
      }, info);
    }

}
