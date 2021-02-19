/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface CheckinRes {

  /**
   * Loco host
   */
  host: string;

  /**
   * Loco host (ipv6)
   */
  host6: string;

  /**
   * Loco port
   */
  port: number;

  /**
   * Expire time(?)
   */
  cacheExpire: number;

  /**
   * Call server host
   */
  cshost: string;

  /**
   * Call server port
   */
  csport: number;

  /**
   * Call server host (ipv6)
   */
  cshost6: string;

  /**
   * Video server host
   */
  vsshost: string;

  /**
   * Video server port
   */
  vssport: number;

  /**
   * Video server host (ipv6)
   */
  vsshost6: string;

}
