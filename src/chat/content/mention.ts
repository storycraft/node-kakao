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
  constructor(private _user: DisplayUserInfo) {

  }


  append(chat: Chat): void {
    if (!chat.attachment) return;
    if (!chat.attachment['mentions']) chat.attachment['mentions'] = [];

    const mentions = chat.attachment['mentions'] as MentionStruct[];
    let map = mentions.find((value) => this._user.userId.eq(value.user_id));
    if (!map || map.len !== this._user.nickname.length) {
      map = {
        user_id: this._user.userId,
        len: this._user.nickname.length,
        at: [],
      };
      mentions.push(map);
    }

    map.at.push(chat.text.length + 1);
    chat.text += `@${this._user.nickname}`;
  }
}
