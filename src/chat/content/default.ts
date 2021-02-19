/*
 * Created on Fri Feb 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from '../chat';
import { ChatContent } from '.';

/**
 * Append text
 */
export class TextContent implements ChatContent {
  constructor(public text: string) {

  }
  
  append(chat: Chat): void {
    chat.text += this.text;
  }
}

/**
 * Append attachment
 */
export class AttachmentContent implements ChatContent {
  constructor(public attachment: Record<string, unknown>) {

  }

  append(chat: Chat): void {
    if (!chat.attachment) return;
    chat.attachment = Object.assign(chat.attachment, this.attachment);
  }
}
