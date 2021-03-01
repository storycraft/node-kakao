/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelInfo, NormalChannelInfo } from './channel-info';

/**
 * Channel
 */
export interface Channel {

  /**
   * Unique channel identifier
   */
  readonly channelId: Long;

}

/**
 * Channel with info
 */
export interface ChannelData extends Channel {

  /**
   * Channel info snapshot.
   */
  readonly info: Readonly<ChannelInfo>;

}

/**
 * Channel with info
 */
export interface NormalChannelData extends Channel {

  /**
   * Channel info snapshot.
   */
  readonly info: Readonly<NormalChannelInfo>;

}
