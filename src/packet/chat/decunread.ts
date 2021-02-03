/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';

export interface DecunreadRes {

  chatId: Long;
  userId: Long;
  watermark: Long;


}
