/*
 * Created on Sat Feb 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatType } from '../../chat';

export interface InvoiceRes {

  /**
   * Media key
   */
  k: string;

  /**
   * Media size
   */
  s: Long;

  /**
   * Media mime type
   */
  mt: string;

  /**
   * Channel id
   */
  c: Long;

  /**
   * Media chat type
   */
  t: ChatType;

  /**
   * Host (unused(?))
   */
  h: string;

  /**
   * Port
   */
  p: number;

  /**
   * VHost
   */
  vh: string;

  /**
   * Vhost (ipv6)
   */
  vh6: string;

  /**
   * Extra json(?)
   */
  ex: string;

}
