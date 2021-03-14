/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatLogged } from '../chat';
import { ChannelUser } from '../user';
import { ChannelData } from './channel-info';
import { ChannelDataUpdater } from './updater';

/**
 * Store channel data
 */
export interface ChannelDataStore<T, U> extends ChannelData<T> {

  /**
   * Get total user count
   */
  readonly userCount: number;

  /**
   * Get channel user info
   *
   * @param user User to find
   */
  getUserInfo(user: ChannelUser): Readonly<U> | undefined;

  /**
   * Get user info iterator
   */
  getAllUserInfo(): IterableIterator<U>;

  /**
   * Get readers in this channel.
   * This may not work correctly on channel with many users. (99+)
   *
   * @param chat
   */
  getReaders(chat: ChatLogged): Readonly<U>[];

  /**
   * Get reader count.
   * This may not work correctly on channel with many users. (99+)
   *
   * @param chat
   */
  getReadCount(chat: ChatLogged): number;

}

export interface UpdatableChannelDataStore<T, U> extends ChannelDataStore<T, U>, ChannelDataUpdater<T, U> {
  
}

export interface ChannelStore<T> {

  /**
   * Try to get channel instance with channel id
   *
   * @param channelId
   */
  get(channelId: Long): T | undefined;

  /**
   * Iterate every channel list
   */
  all(): IterableIterator<T>;

  /**
   * Total channel count
   */
  readonly size: number;

}
