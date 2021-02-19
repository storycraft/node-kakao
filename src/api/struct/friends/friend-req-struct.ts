/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FriendStruct } from './friend-struct';

export interface FriendReqStruct {

  friend: FriendStruct;

}

export interface FriendReqPhoneNumberStruct {

  // eslint-disable-next-line camelcase
  pstn_number: string;

}
