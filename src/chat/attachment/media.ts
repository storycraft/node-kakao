/*
 * Created on Sat Feb 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface PhotoAttachment {

  /**
   * Fallback url
   */
  url: string;

  /**
   * Media key
   */
  k: string;

  /**
   * Width
   */
  w: number;

  /**
   * Height
   */
  h: number;

  thumbnailUrl: string;

  thumbnailWidth: number;
  thumbnailHeight: number;

  /**
   * Checksum (sha1)
   */
  cs: string;

  /**
   * Size
   */
  s: number;

  /**
   * Media type
   */
  mt: string;

}

export interface MultiPhotoAttachment {
  /**
   * Key list
   */
  kl: string[];

  /**
   * Width list
   */
  wl: number[];

  /**
   * Height list
   */
  hl: number[];

  /**
   * Checksum list (sha1)
   */
  csl: string[];

  /**
   * Fallback image url list
   */
  imageUrls: string[];

  thumbnailUrls: string[];

  thumbnailWidths: number[];
  thumbnailHeights: number[];

  /**
   * Size list
   */
  sl: number;
}

export interface VideoAttachment {

  /**
   * Fallback url
   */
  url: string;

  /**
   * Media key
   */
  tk: string;

  /**
   * Width
   */
  w: number;

  /**
   * Height
   */
  h: number;

  /**
   * Checksum
   */
  cs: string;

  /**
   * Video duration
   */
  d: number;

  /**
   * Size
   */
  s: number;

}

export interface FileAttachment {

  /**
   * File name
   */
  name: string;

  /**
   * Fallback url
   */
  url: string;

  /**
   * Media key
   */
  k: string;

  /**
   * File size
   */
  size: number;

  /**
   * File size. Same as @field size
   */
  s: number;

  /**
   * Expire time
   */
  expire: number;

  /**
   * File checksum (sha1)
   */
  cs: string;

}

export interface AudioAttachment {
  /**
   * Fallback url
   */
  url: string;

  /**
   * Media key
   */
  k: string;

  /**
   * Duration (in milliseconds)
   */
  d: number;

  /**
   * Size
   */
  s: number;

  /**
   * Expire time
   */
  expire: number;
}

export interface LongTextAttachment {
  /**
   * Text path
   */
  path: string;

  /**
   * Media key
   */
  k: string;

  /**
   * Size
   */
  s: number;

  /**
   * true if chat text is sliced.
   */
  sd: boolean;
}
