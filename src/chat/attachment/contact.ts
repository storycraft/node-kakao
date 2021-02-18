/*
 * Created on Fri Feb 12 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Attachment } from '.';

/**
 * KakaoTalk profile attachment
 */
export interface ProfileAttachment extends Attachment {

  /**
   * Profile user id
   */
  userId: number | Long;

  /**
   * User nickname
   */
  nickName: string;

  /**
   * User main profile (full)
   */
  fullProfileImageUrl: string;

  /**
   * User profile
   */
  profileImageUrl: string;

  /**
   * Profile status message
   */
  statusMessage: string;

}

/**
 * Call Contact attachment
 */
export interface ContactAttachment extends Attachment {

  /**
   * Contact name
   */
  name: string;

  /**
   * vcf contact file url
   */
  url: string;

}