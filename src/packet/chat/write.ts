/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatlogStruct } from '../struct';

export interface WriteRes {

  msgId: number;

  chatId: Long;

  logId: Long;
  prevId: Long;

  sendAt: number;

  chatLog?: ChatlogStruct;

}
