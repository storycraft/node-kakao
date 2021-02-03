/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelMetaStruct } from '../struct';

export interface ChgMetaRes {

  chatId: Long;

  meta: ChannelMetaStruct;

}
