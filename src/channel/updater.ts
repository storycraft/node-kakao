/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelUser } from '../user';

/**
 * Update channel data
 */
 export interface ChannelDataUpdater<T, U> {

  /**
   * Update channel info
   *
   * @param info
   */
  updateInfo(info: Partial<T>): void;

  /**
   * Set channel info
   */
  setInfo(info: T): void;

  /**
   * Update or add user info
   *
   * @param user
   */
  updateUserInfo(user: ChannelUser, info: Partial<U>): void;

  /**
   * Remove user
   * @param user
   */
  removeUser(user: ChannelUser): boolean;
  
  /**
   * Clear all user info
   */
  clearUserList(): void;

  /**
   * Update watermark
   *
   * @param readerId
   */
  updateWatermark(readerId: Long, watermark?: Long): void;

  /**
   * Clear all watermark 
   */
  clearWatermark(): void;

}
