/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatType } from '../../chat';

export enum ChatRefererType {

  KAKAOI = 1,
  BOT = 2

}

export type ChatReferer = ChatRefererType | number;

/**
 * Chat object
 */
export interface ChatlogStruct {

  /**
   * Chat log id
   */
  logId: Long;

  /**
   * Channel id
   */
  chatId: Long;

  /**
   * Chat type
   */
  type: ChatType;

  /**
   * Sender user id
   */
  authorId: Long;

  /**
   * Message content
   */
  message?: string;

  /**
   * Message sent time. (multiply by 1000 to convert to js Date timestamp)
   */
  sendAt: number;

  /**
   * Message extra attachment
   */
  attachment: string;

  /**
   * Unknown
   */
  msgId: number | Long;

  /**
   * Previous log id (0 if first chat)
   */
  prevId: Long;

  /**
   * Plus chat only (contains quick reply, custom gui config)
   */
  supplement?: string;

  /**
   * Plus chat only(?)
   */
  referer?: ChatReferer;

}
