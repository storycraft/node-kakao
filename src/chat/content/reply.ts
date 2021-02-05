/*
 * Created on Fri Feb 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatContent } from '.';
import { MentionStruct, ReplyAttachment } from '../attachment';
import { Chat, Chatlog } from '../chat';

/**
 * Set reply chat
 */
export class ReplyContent implements ChatContent {
  /**
   * Target chat
   */
  chat: Chatlog;

  /**
   * If true only target chat will be visible.
   * Used for emoticon reply.
   */
  attachOnly: boolean;

  /**
   * Chat to attach to reply.
   * Text field will be not get attached.
   * Using emoticon is supported.
   */
  attach?: Chat;

  constructor(chat: Chatlog, attachOnly = false, attach?: Chat) {
    this.chat = chat;
    this.attachOnly = attachOnly;
    this.attach = attach;
  }

  append(chat: Chat): void {
    if (!chat.attachment) return;
    const attachment = chat.attachment as Partial<ReplyAttachment>;

    attachment.attach_only = this.attachOnly;

    if (this.attach) {
      attachment.attach_type = this.attach.type;
      Object.assign(chat.attachment, this.attach.attachment);
    }

    attachment.src_logId = this.chat.logId;
    attachment.src_mentions = this.chat.attachment && this.chat.attachment['mentions'] as MentionStruct[] || [];
    attachment.src_message = this.chat.text;
    attachment.src_type = this.chat.type;
    attachment.src_userId = this.chat.sender.userId;
  }
}
