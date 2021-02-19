/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatlogStruct } from '../struct';

export interface MsgRes {

  /**
   * Channel id
   */
  chatId: Long;

  /**
   * Open channel link Id
   */
  li?: Long;

  /**
   * Chat log id
   */
  logId: Long;

  /**
   * Chat log struct
   */
  chatLog: ChatlogStruct;

  /**
   * true if chat sent without seen. (Official client seems always true except special cases like notification reply.)
   */
  noSeen: boolean;

  /**
   * Sender nickname
   */
  authorNickname: string;

  /**
   * true if notification read(?)
   */
  notiRead: boolean;

}
