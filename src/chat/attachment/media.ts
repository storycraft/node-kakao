/*
 * Created on Sat Feb 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Attachment } from '.';

/**
 * A complete media attachment with its media key.
 * There can be more data by types. Mix with attachment typings below.
 */
export interface MediaKeyAttachment extends Attachment {
  /**
   * Media key (Uploaded via media uploader)
   */
  k: string;

  /**
   * Fallback url
   */
  url: string;

  /**
   * Size
   */
  s: number;

}

export interface PhotoAttachment extends Attachment {

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
   * Media type
   */
  mt: string;

}

export interface MultiPhotoAttachment extends Attachment {
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

export interface VideoAttachment extends Attachment {
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

}

export interface FileAttachment extends Attachment {

  /**
   * File name
   */
  name: string;

  /**
   * File size
   */
  size: number;

  /**
   * Expire time
   */
  expire: number;

  /**
   * File checksum (sha1)
   */
  cs: string;

}

export interface AudioAttachment extends Attachment {
  /**
   * Duration (in milliseconds)
   */
  d: number;

  /**
   * Expire time
   */
  expire?: number;
}

export interface LongTextAttachment extends Attachment {
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
