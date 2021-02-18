/*
 * Created on Sat Feb 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Attachment } from '.';

export interface EmoticonAttachment extends Attachment {

  /**
   * Emoticon path
   */
  path: string;

  /**
   * Emoticon text
   */
  name: string;

  /**
   * Image type
   */
  type: string;

  /**
   * Description
   */
  alt: string;

  /**
   * Stop position
   */
  s?: number;

  /**
   * Emoticon sound url
   */
  sound?: string;

  /**
   * Emoticon resize width
   */
  width?: number;

  /**
   * Emoticon resize height
   */
  height?: number;

}
