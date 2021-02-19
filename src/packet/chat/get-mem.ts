/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { NormalMemberStruct, OpenMemberStruct } from '../struct';

export interface GetMemRes {

  /**
   * Member list
   */
  members: NormalMemberStruct[] | OpenMemberStruct[];

  /**
   * Last update time
   */
  token: number;

}
