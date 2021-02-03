/*
 * Created on Tue Jan 26 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { OpenChannelUserPerm } from '../../openlink';

export interface SyncMemTRes {

  /**
   * Channel id
   */
  c: Long;

  /**
   * Link id
   */
  li: Long;

  /**
   * Member id list
   */
  mids: Long[];

  /**
   * Perm list
   */
  mts: OpenChannelUserPerm[];

}
