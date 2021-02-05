/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from './chat';
import { ChatType } from './chat-type';
import { ChatContent } from './content';

/**
 * Build Chat object from existing chat or create new.
 */
export class ChatBuilder {
  private _contents: (string | ChatContent)[];

  /**
   * Set chat options (shout, inapp)
   * This can be overridden by ChatContents.
   */
  public options: Record<string, unknown>;

  constructor() {
    this._contents = [];
    this.options = {};
  }

  /**
   * Append text or chat content.
   *
   * @param {string | ChatContent} content
   * @return {this}
   */
  append(content: string | ChatContent): this {
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
    this.options['shout'] = flag;
    return this;
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

    chat.attachment = Object.assign(chat.attachment, this.options);

    for (const content of this._contents) {
      if (typeof content === 'string') {
        chat.text += content;
      } else {
        content.append(chat);
      }
    }

    return chat;
  }
}
