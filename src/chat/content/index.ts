/*
 * Created on Mon Feb 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './default';
export * from './mention';
export * from './reply';

import { Chat } from '../chat';

export interface ChatContent {

  /**
   * Append content to chat
   *
   * @param {Chat} chat
   */
  append(chat: Chat): void;

}