/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chatlog, getOriginalType, isDeletedChat } from '../../chat';
import { MentionStruct } from '../../chat/attachment';
import { MediaKeyComponent } from '../../media';
import { ChannelUser, ChannelUserInfo } from '../../user';
import { TalkChannel } from '../channel';

/**
 * Store Chatlog and provides convenient methods.
 */
export class TalkChatData {
  constructor(private _chat: Chatlog) {

  }

  /**
   * Chat text. Empty string if value is nullish.
   */
  get text(): string {
    return this._chat.text || '';
  }

  get sendAt(): Date {
    return new Date(this._chat.sendAt);
  }

  /**
   * Chatlog object
   */
  get chat(): Readonly<Chatlog> {
    return this._chat;
  }

  /**
   * The chat object's type property has the type value bit masked when the chat is deleted.
   * @return {number} the original chat type
   */
  get originalType(): number {
    return getOriginalType(this._chat.type);
  }

  /**
   * Get url list in chat. Can be used to generate url preview.
   * It is not for detecting urls.
   */
  get urls(): string[] {
    if (!this._chat.attachment || !Array.isArray(this._chat.attachment['urls'])) return [];

    return this._chat.attachment['urls'];
  }

  /**
   * Get mention list
   */
  get mentions(): MentionStruct[] {
    if (!this._chat.attachment || !Array.isArray(this._chat.attachment['mentions'])) return [];

    return this._chat.attachment.mentions;
  }

  /**
   * @return {boolean} true if chat has shout option
   */
  get isShout(): boolean {
    if (!this._chat.attachment) return false;

    return !!this._chat.attachment.shout;
  }

  /**
   * Get medias on chat.
   */
  get medias(): TalkChatMedia[] {
    const attachment = this._chat.attachment;
    if (!attachment) return [];

    if (
      Array.isArray(attachment['kl']) &&
      Array.isArray(attachment['sl']) &&
      Array.isArray(attachment['imageUrls'])
    ) {
      // Multi photo
      const keyList = attachment['kl'] as string[];
      const sizeList = attachment['sl'] as number[];
      const urlList = attachment['imageUrls'] as string[];

      return keyList.map((key, index) => {
        return {
          key,
          size: sizeList[index],
          url: urlList[index],
        };
      });
    } else if (attachment['k'] || attachment['tk']) {
      // Photo, file, audio, video
      const size = (attachment['s'] || attachment['size']) as number;
      const url = attachment['url'] as string;
      return [
        {
          key: (attachment['k'] || attachment['tk']) as string,
          size,
          url,
        },
      ];
    }

    return [];
  }

  /**
   * Get channel user info from channel.
   * this is equivalent of calling channel.getUserInfo(data.chat.sender);
   *
   * @param {TalkChannel} channel
   * @return {ChannelUserInfo | undefined}
   */
  getSenderInfo(channel: TalkChannel): ChannelUserInfo | undefined {
    return channel.getUserInfo(this._chat.sender);
  }

  /**
   * Almost same as chat.attachment but supports typing and null safe.
   *
   * @return {Partial<T>} non null attachment object
   */
  attachment<T>(): Partial<T> {
    if (!this._chat.attachment) return {};

    return this._chat.attachment as Partial<T>;
  }

  /**
   * Forward chat to another channel
   *
   * @param {TalkChannel} channel
   */
  forwardTo(channel: TalkChannel): void {
    channel.sendChat(this._chat);
  }

  /**
   * @return {boolean} true when the chat is deleted.
   */
  isDeleted(): boolean {
    return isDeletedChat(this._chat.type);
  }

  /**
   * Check if any users are mentioned.
   *
   * @param {ChannelUser[]} users Users to find
   * @return {boolean} true if anyone is mentioned
   */
  isMentioned(...users: ChannelUser[]): boolean {
    const mentions = this.mentions;
    if (mentions.length < 1) return false;

    for (const mention of mentions) {
      const userId = mention.user_id;

      for (const user of users) {
        if (user.userId.eq(userId)) return true;
      }
    }

    return false;
  }
}

export interface TalkChatMedia extends MediaKeyComponent {
  /**
   * Media size
   */
  size: number;
  /**
   * Media url
   */
  url: string;
}
