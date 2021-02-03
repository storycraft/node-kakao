/*
 * Created on Tue Jan 26 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatlogStruct } from '../struct';

export interface SyncJoinRes {

  /**
   * Channel id
   */
  c: Long;

  /**
   * Join chat (feed)
   */
  chatLog: ChatlogStruct;

}
