/*
 * Created on Fri Feb 12 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MapAttachment {

  /**
   * Latitude (multiplied by 10000000000)
   */
  lat: number;

  /**
   * Longitude (multiplied by 10000000000)
   */
  lng: number;

  /**
   * Map address
   */
  a: string;

  /**
   * true if using kakao map
   */
  c: boolean;

}