/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from './chat';
import { ChatType } from './chat-type';
import { AttachmentContent, ChatContent, TextContent } from './content';

/**
 * Build Chat object from existing chat or create new.
 */
export class ChatBuilder {
  private _contents: ChatContent[];

  constructor() {
    this._contents = [];
  }

  /**
   * Append text.
   * this is equivalent of calling builder.append(new TextContent(text));
   *
   * @param {string} text
   * @return {this}
   */
  text(text: string): this {
    return this.append(new TextContent(text));
  }

  /**
   * Append attachment.
   * this is equivalent of calling builder.append(new AttachmentContent(attachment));
   *
   * @param {Record<string, unknown>} attachment
   * @return {this}
   */
  attachment(attachment: Record<string, unknown>): this {
    return this.append(new AttachmentContent(attachment));
  }

  /**
   * Append chat content.
   *
   * @param {ChatContent} content
   * @return {this}
   */
  append(content: ChatContent): this {
    this._contents.push(content);
    return this;
  }

  /**
   * Set shout option.
   * Only have visual effect on open channel.
   *
   * @param {boolean} flag
   * @return {this}
   */
  shout(flag: boolean): this {
    return this.attachment({ shout: flag });
  }

  /**
   * Build into chat object from existing chat or with type.
   *
   * @param {Chat | ChatType} data
   * @return {Chat}
   */
  build(data: Chat | ChatType): Chat {
    let chat: Chat;
    if (typeof data === 'object') {
      chat = data as Chat;
    } else if (typeof data === 'number') {
      chat = {
        type: data,
        text: '',
        attachment: {},
      };
    } else {
      throw new Error('Unknown ChatType or Chat object supplied');
    }

    if (!chat.attachment) chat.attachment = {};

    for (const content of this._contents) {
      content.append(chat);
    }

    return chat;
  }
}
