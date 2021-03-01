/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from '../channel';
import { OpenLinkComponent } from '.';
import { OpenChannelInfo } from './open-channel-info';

/**
 * Open chat channel
 */
export interface OpenChannel extends Channel, OpenLinkComponent {


}

/**
 * OpenChannel with info
 */
export interface OpenChannelData extends OpenChannel {

  /**
   * Channel info snapshot.
   */
  readonly info: Readonly<OpenChannelInfo>;

}