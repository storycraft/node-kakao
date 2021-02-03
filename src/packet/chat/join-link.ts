/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelInfoStruct, ChatlogStruct, OpenLinkChannelUserStruct, OpenLinkStruct } from '../struct';

export interface JoinLinkRes {

  /**
   * Target openlink struct
   */
  ol: OpenLinkStruct;

  /**
   * Link profile
   */
  olu?: OpenLinkChannelUserStruct;

  /**
   * Channel info
   */
  chatRoom: ChannelInfoStruct;

  /**
   * Join feed chatlog
   */
  chatLog: ChatlogStruct;

}
