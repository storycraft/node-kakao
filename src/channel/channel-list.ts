/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { TypedEmitter } from '../event';
import { ChannelListEvent } from '../talk/event';
import { Channel } from './channel';

/**
 * ChannelList manage specific type of channels or child channel list.
 */
export interface ChannelList<T extends Channel> extends TypedEmitter<ChannelListEvent> {

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
