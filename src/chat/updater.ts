/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog } from './chat';

/**
 * Update or add chat to store
 */
export interface ChatListUpdater {

  /**
   * Push chat
   * @param chat
   */
  addChat(...chat: Chatlog[]): Promise<void>;

  /**
   * Update existing chat
   * @param logId
   * @param chat
   */
  updateChat(logId: Long, chat: Partial<Chatlog>): Promise<void>;

  /**
   * Remove chat
   * @param logId
   */
  removeChat(logId: Long): Promise<boolean>;

}
