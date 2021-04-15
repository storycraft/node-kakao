/*
 * Created on Fri Apr 16 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelDataStruct } from '../struct';

export interface LChatListRes {
  chatDatas: ChannelDataStruct[];
  lastChatId: Long;
  lastTokenId: Long;
  mcmRevision: number;
  delChatIds: Long[];
  kc: unknown[];
  ltk: Long;
  lbk: number;

  // True if there is no more channel list left.
  eof: boolean;
}