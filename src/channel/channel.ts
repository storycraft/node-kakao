/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';

/**
 * Channel
 */
export interface Channel {

  /**
   * Unique channel identifier
   */
  readonly channelId: Long;

}
