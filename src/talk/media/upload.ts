/*
 * Created on Wed Feb 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { MediaMetadata } from '../../media';

export interface MediaUploadTemplate extends MediaMetadata {

  /**
   * File data
   */
  data: Uint8Array;

}
