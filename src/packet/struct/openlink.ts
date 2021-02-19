/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { OpenLinkType } from '../../openlink';
import { OpenLinkChannelUserStruct } from './user';

export interface OpenLinkStruct {

  /**
   * Link id
   */
  li: Long;

  /**
   * Open token
   */
  otk: number;

  /**
   * Link name
   */
  ln: string;

  /**
   * Link url
   */
  lu: string;

  /**
   * Link image url
   */
  liu: string;

  /**
   * Link cover url
   */
  lcu: string;

  /**
   * Owner link user
   */
  olu: OpenLinkChannelUserStruct;

  /**
   * Unknown
   */
  vt: number;

  /**
   * Link type
   */
  lt: OpenLinkType;

  /**
   * Description
   */
  desc: string;

  pc: string;

  pa: boolean;

  /**
   * Activated
   */
  ac: boolean;

  /**
   * Searchable
   */
  sc: boolean;

  /**
   * Link privilege mask(?)
   */
  pv: Long;

  /**
   * Unknown
   */
  ex: boolean;

  omt: unknown;

  /**
   * Link creation time
   */
  ca: number;

  /**
   * Open channel cover
   */
  oc?: { t: OpenLinkType; co: { desc: string }; };

  /**
   * Open profile cover
   */
  op?: { desc: string; tags?: string[]; };

}

/**
 * OpenLink extra info
 */
export interface OpenLinkInfoStruct {

  /**
   * Max user limit (open channel)
   */
  ml?: number;

  /**
   * Max direct limit (open profile)
   */
  dcl?: number;

}

export interface InformedOpenLinkStruct extends OpenLinkStruct, OpenLinkInfoStruct {

}
