/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelMetaStruct } from '../struct';

export interface SetMetaRes {

  /**
   * Channel id
   */
  chatId: Long;

  meta: ChannelMetaStruct;

}
