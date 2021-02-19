/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatlogStruct } from '../struct';

export interface LinkKickedRes {

  /**
   * Kicked channel id
   */
  c: Long;

  /**
   * Kick feed
   */
  chatLog: ChatlogStruct;

}
