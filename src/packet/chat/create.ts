/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelInfoStruct } from '../struct';

export interface CreateRes {

  chatId: Long;

  chatRoom?: ChannelInfoStruct;

}
