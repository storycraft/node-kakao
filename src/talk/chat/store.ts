/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog, UpdatableChatListStore } from '../../chat';

const EMPTY_ITERATOR: AsyncIterableIterator<unknown> = {
  [Symbol.asyncIterator]() {
    return this;
  },

  async next() {
    return { done: true, value: null };
  }
};

export const EmptyChatListStore: UpdatableChatListStore = {

  async get(): Promise<Chatlog | undefined> {
    return;
  },

  async last(): Promise<Chatlog | undefined> {
    return;
  },

  before(): AsyncIterableIterator<Chatlog> {
    return EMPTY_ITERATOR as AsyncIterableIterator<Chatlog>;
  },

  since(): AsyncIterableIterator<Chatlog> {
    return EMPTY_ITERATOR as AsyncIterableIterator<Chatlog>;
  },

  all(): AsyncIterableIterator<Chatlog> {
    return EMPTY_ITERATOR as AsyncIterableIterator<Chatlog>;
  },

  async addChat(): Promise<void> {
    return;
  },

  async updateChat(): Promise<void> {
    return;
  },

  async removeChat(): Promise<boolean> {
    return false;
  }

}

/**
 * Inmemory chat list with count limit
 */
export class TalkMemoryChatListStore implements UpdatableChatListStore {

  constructor(
    public limit: number,
    private _chatList: Chatlog[] = []
  ) {

  }

  private findIndex(logId: Long): number {
    return this._chatList.findIndex((value) => logId.eq(value.logId));
  }

  private makeIterator(slice: Chatlog[]): AsyncIterableIterator<Chatlog> {
    const iter = slice[Symbol.iterator]();

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async () => {
        return iter.next();
      }
    };
  }

  async get(logId: Long): Promise<Chatlog | undefined> {
    const i = this.findIndex(logId);
    if (i < 0) return;

    return this._chatList[i];
  }

  async last(): Promise<Chatlog | undefined> {
    if (this._chatList.length < 0) return;

    return this._chatList[this._chatList.length - 1];
  }

  before(logId: Long, maxCount: number = this._chatList.length): AsyncIterableIterator<Chatlog> {
    const start = this.findIndex(logId);
    const slice = start < 0 ? [] : this._chatList.slice(Math.max(0, start - maxCount), start);

    return this.makeIterator(slice);
  }

  since(time: number): AsyncIterableIterator<Chatlog> {
    const start = this._chatList.findIndex((value) => value.sendAt >= time);
    const slice = start < 0 ? [] : this._chatList.slice(start);

    return this.makeIterator(slice);
  }

  all(): AsyncIterableIterator<Chatlog> {
    return this.makeIterator(this._chatList.slice());
  }

  async addChat(...chat: Chatlog[]): Promise<void> {
    if (this._chatList.length >= this.limit) {
      this._chatList = this._chatList.slice(this.limit - this._chatList.length + 1);
    }

    this._chatList.push(...chat);

    this._chatList.sort((a, b) => {
      return a.logId.comp(b.logId);
    });
  }

  async updateChat(logId: Long, chat: Partial<Chatlog>): Promise<void> {
    const i = this.findIndex(logId);
    if (i < 0 || !this._chatList[i]) return;

    this._chatList[i] = { ...this._chatList[i], ...chat };
  }

  async removeChat(logId: Long): Promise<boolean> {
    const i = this.findIndex(logId);
    if (i < 0) return false;

    this._chatList.splice(i, 1);
    return true;
  }

}
