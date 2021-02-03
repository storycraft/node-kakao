/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FriendStruct } from './friend-struct';
import { Long } from 'bson';

export interface FriendFindIdStruct {

  token: Long;
  friend: FriendStruct;

}

export interface FriendFindUUIDStruct {

  member: FriendStruct;

}
