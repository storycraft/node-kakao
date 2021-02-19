/*
 * Created on Fri Feb 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatContent } from '.';
import { DisplayUserInfo } from '../../user';
import { MentionStruct } from '../attachment';
import { Chat } from '../chat';

/**
 * Mentions user
 */
export class MentionContent implements ChatContent {
  constructor(public user: DisplayUserInfo) {

  }

  append(chat: Chat): void {
    if (!chat.attachment) return;
    if (!chat.attachment['mentions']) chat.attachment['mentions'] = [];

    const mentions = chat.attachment['mentions'] as MentionStruct[];
    const lastAt = Math.max(0, ...mentions.map((value) => Math.max(0, ...value.at)));

    let map = mentions.find((value) => this.user.userId.eq(value.user_id));
    if (!map || map.len !== this.user.nickname.length) {
      map = {
        user_id: this.user.userId,
        len: this.user.nickname.length,
        at: [],
      };
      mentions.push(map);
    }

    map.at.push(lastAt + 1);
    chat.text += `@${this.user.nickname}`;
  }
}
