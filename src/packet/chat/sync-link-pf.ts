/*
 * Created on Tue Jan 26 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { OpenLinkChannelUserStruct } from '../struct';

export interface SyncLinkPfRes {

  /**
   * Channel id
   */
  c?: Long;

  /**
   * Link id
   */
  li?: Long;

  /**
   * Updated open link user
   */
  olu: OpenLinkChannelUserStruct;

}
