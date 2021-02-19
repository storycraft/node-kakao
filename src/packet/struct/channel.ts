/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelType } from '../../channel';
import { ChannelMetaType } from '../../channel/meta';
import { ChatlogStruct } from './chat';

export interface ChannelMetaStruct {

  type: ChannelMetaType;

  revision: number;

  authorId: Long;

  content: string;

  updatedAt: number;

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

export interface DisplayUserStruct {

  userId: Long;

  nickName: string;

  countryIso: string;

  profileImageUrl: string;

}

export interface ChannelInfoStruct extends Partial<NormalChannelInfoExtra>, Partial<OpenChannelInfoExtra> {

  /**
   * Channel id
   */
  chatId: Long;

  /**
   * Channel type
   */
  type: ChannelType;

  /**
   * Active members count
   */
  activeMembersCount: number;

  /**
   * New message count since this info
   */
  newMessageCount: number;

  /**
   * true if newMessageCount is invalid
   */
  invalidNewMessageCount: boolean;

  /**
   * Unknown
   */
  lastUpdatedAt?: unknown;

  /**
   * Unknown
   */
  lastMessage?: unknown;

  /**
   * Last chat log id
   */
  lastLogId: Long;

  /**
   * Last seen chat log id
   */
  lastSeenLogId: Long;

  /**
   * Last chat log (null if last chat is from 3 days ago)
   */
  lastChatLog?: ChatlogStruct;

  /**
   * Possibly client settings.
   */
  meta?: ChannelClientMetaStruct;

  /**
   * Channel metas
   */
  chatMetas: ChannelMetaStruct[];

  /**
   * Display user list
   */
  displayMembers: DisplayUserStruct[];

  /**
   * push alert setting
   */
  pushAlert: boolean;
}

export interface NormalChannelInfoExtra {

  /**
   * true if channel is invalid(?).
   */
  left: boolean;

  /**
   * New mem join time(?)
   */
  joinedAtForNewMem: number;

}

export interface OpenChannelInfoExtra {

  /**
   * OpenLink id
   */
  li: Long;

  /**
   * OpenLink token
   */
  otk: number;

  /**
   * true if channel is dm
   */
  directChat: boolean;

  /**
   * Unknown
   */
  o: Long;

}
