/*
 * Created on Fri Feb 05 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';

export interface MentionAttachment {

  mentions?: MentionStruct[];

}

/**
 * Raw chat mention typings
 */
export interface MentionStruct {

  /**
   * Index list
   */
  at: number[];

  /**
   * Mention text length, except @ prefix.
   */
  len: number;

  /**
   * Target user id
   */
  // eslint-disable-next-line camelcase
  user_id: Long | number;

}
