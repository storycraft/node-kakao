/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FriendStruct } from './friend-struct';

export interface FriendSearchUserListStruct {

  count: number;
  list: FriendStruct[];

}

export interface FriendSearchStruct {

  query: string;
  user?: FriendSearchUserListStruct;
  plus?: FriendSearchUserListStruct;
  categories: string[];
  // eslint-disable-next-line camelcase
  total_counts: number;

}
