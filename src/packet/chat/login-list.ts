/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelDataStruct } from '../struct/channel';

export interface LoginListRes {
  chatDatas: ChannelDataStruct[];
  lastChatId: Long;
  lastTokenId: Long;
  mcmRevision: number;
  delChatIds: Long[];
  kc: unknown[];
  ltk: Long;
  lbk: number;
  eof: boolean;
  userId: Long;
  revision: number;
  revisionInfo: string;
  minLogId: Long;
  sb: number;
}
