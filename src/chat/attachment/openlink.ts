/*
 * Created on Fri Feb 12 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { PostAttachment } from './post';

export interface OpenScheduleAttachment extends PostAttachment {

  /**
   * Schedule item id(?)
   */
  scheduleId: number;

  /**
   * Title
   */
  title: string;

  /**
   * Schedule start time
   */
  eventAt: number;

}