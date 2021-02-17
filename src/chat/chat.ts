/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelUser } from '../user/channel-user';
import { Attachment } from './attachment';
import { ChatType } from './chat-type';

export interface ChatTypeComponent<T extends ChatType = ChatType> {

  /**
   * Chat type
   */
  type: T;

}

/**
 * Chat interface
 */
export interface Chat extends ChatTypeComponent {

  /**
   * Chat text.
   */
  text?: string;

  /**
   * Optional attachment json
   */
  attachment?: Attachment;

  /**
   * Optional supplement json.
   * Only used in Pluschat for extra components(quick reply, custom menus, e.t.c.) and cannot be sent.
   */
  supplement?: Record<string, unknown>;

}

export type TypedChat<T extends ChatType> = Chat & ChatTypeComponent<T>;

export interface ChatLogged {

  /**
   * chat id on server
   */
  logId: Long;

}

export interface ChatLoggedType extends ChatLogged {

  type: ChatType;

}

export interface ChatLogLinked extends ChatLogged {

  /**
   * Previous logId
   */
  prevLogId: Long;

}

export interface ChatWritten extends Chat {

  /**
   * Chat sender
   */
  sender: ChannelUser;

  /**
   * Message sent time (js Date timestamp)
   */
  sendAt: number;

  /**
   * Unknown
   */
  messageId: number | Long;

}

export interface Chatlog extends ChatLogLinked, ChatWritten {

}

export type TypedChatlog<T extends ChatType> = Chatlog & TypedChat<T>;

export interface ChatOptions {

  /**
   * Shout option that can be used on OpenChat
   */
  shout?: boolean;

}
