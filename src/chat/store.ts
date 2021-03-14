/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog } from './chat';
import { ChatListUpdater } from './updater';

/**
 * Store chats
 */
export interface ChatStore {

  /**
   * Get latest chatlog
   */
  last(): Promise<Chatlog | undefined>;

  /**
   * Get chat with log id
   * @param logId
   */
  get(logId: Long): Promise<Chatlog | undefined>;

  /**
   * Iterate chats before logid
   * @param logId
   * @param maxCount
   */
  before(logId: Long, maxCount?: number): AsyncIterableIterator<Chatlog>;

  /**
   * Iterate chats since given time
   * @param time
   */
  since(time: number): AsyncIterableIterator<Chatlog>;

  /**
   * Iterate every chat
   */
  all(): AsyncIterableIterator<Chatlog>;

}

export interface UpdatableChatListStore extends ChatStore, ChatListUpdater {
  
}
