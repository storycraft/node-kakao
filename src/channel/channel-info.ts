/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog } from '../chat';
import { DisplayUserInfo } from '../user';
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

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
export namespace NormalChannelInfo {

  export function createPartial(info: Partial<NormalChannelInfo>): NormalChannelInfo {
    return Object.assign({
      ...ChannelInfo.createPartial(info),
      joinTime: 0,
    }, info);
  }

}

/**
 * Channel with info data
 */
export interface ChannelData<T> {

  /**
   * Channel info snapshot.
   */
  readonly info: Readonly<T>;

}

/**
 * Channel data on login
 */
export interface LoginData<T> {

  /**
   * Info update time
   */
  lastUpdate: number;

  channel: T;

}

export interface NormalChannelData extends Channel, ChannelData<NormalChannelInfo> {

}