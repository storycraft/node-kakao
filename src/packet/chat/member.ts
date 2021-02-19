/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { NormalMemberStruct, OpenMemberStruct } from '../struct';

export interface MemberRes {

  /**
   * Channel id
   */
  chatId: Long;

  /**
   * Member list
   */
  members: NormalMemberStruct[] | OpenMemberStruct[];

}
