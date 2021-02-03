/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelType } from '../../channel';
import { NormalMemberStruct, OpenLinkChannelUserStruct, OpenMemberStruct } from '../struct';

export interface ChatOnRoomRes {

  /**
   * Channel id
   */
  c: Long;

  /**
   * Channel type
   */
  t: ChannelType;

  /**
   * Open token (openchat)
   */
  otk?: number;

  /**
   * Member struct list (length <= 100)
   */
  m?: (NormalMemberStruct | OpenMemberStruct)[];

  /**
   * Member id list (length > 100)
   */
  mi?: Long[];

  /**
   * Watermark user id keys
   */
  a?: Long[];

  /**
   * Watermark values
   */
  w?: Long[];

  /**
   * Last log id
   */
  l: Long;

  /**
   * Unknown
   */
  o: Long;

  /**
   * Unknown
   */
  jsi: Long;

  /**
   * Client openlink user struct
   */
  olu?: OpenLinkChannelUserStruct;

  /**
   * Unknown (openchat)
   */
  notiRead?: boolean;

  /**
   * Unknown (openchat)
   */
  ef?: boolean;

  /**
   * Unknown
   */
  f: boolean;

  /**
   * Unknown json
   */
  mr: string;

  /**
   * Unknown
   */
  pct: unknown;

  /**
   * Unknown (normal chat)
   */
  sui?: number;

  /**
   * Unknown (open chat)
   */
  msr?: Long;

}
