/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { LinkPrivilegeMask } from '../../openlink';
import { OpenChannelUserPerm, OpenProfileType } from '../../openlink';
import { UserType } from '../../user';

/**
 * Member struct for normal channel
 */
export interface NormalMemberStruct {

  /**
   * User id
   */
  userId: Long;

  /**
   * Account id
   */
  accountId: number;

  /**
   * Nickname
   */
  nickName: string;

  /**
   * User country iso
   */
  countryIso: string;

  profileImageUrl: string;
  fullProfileImageUrl: string;
  originalProfileImageUrl: string;

  /**
   * Profile status message
   */
  statusMessage: string;

  /**
   * Linked kakao services. (ex: story)
   */
  linkedServices: string;

  /**
   * User type
   */
  type: UserType;

  /**
   * Account status
   */
  suspended: boolean;

  /**
   * User type(?) Unknown
   */
  ut: number;

}

/**
 * Member struct for open channel
 */
export interface OpenMemberStruct {

  userId: Long;

  /**
   * User type always 1000 for open chat member.
   */
  type: UserType;

  /**
   * Nickname
   */
  nickName: string;

  /**
   * Profile image url
   */
  pi: string;

  /**
   * Full profile image url
   */
  fpi: string;

  /**
   * Original profile image url
   */
  opi: string;

  /**
   * open token
   */
  opt: number;

  /**
   * Only presetns if user is using open profile.
   */
  pli?: Long;

  /**
   * Open chat user permission
   */
  mt: OpenChannelUserPerm;

}

export interface OpenLinkKickedMemberStruct {

  userId: Long;

  nickName: string;

  /**
   * Profile image
   */
  pi: string;

  /**
   * Kicked channel
   */
  c: Long;

  /**
   * Unknown
   */
  dc: boolean;

}

export interface OpenLinkUserStruct {

  /**
   * Openlink profile type
   */
  ptp: OpenProfileType;

  /**
   * Open chat user permission
   */
  lmt: OpenChannelUserPerm

  /**
   * Nickname
   */
  nn: string;

  /**
   * Profile image url
   */
  pi: string;

  /**
   * Full profile image url
   */
  fpi: string;

  /**
   * Original profile image url
   */
  opi: string;

  opt: number;

  /**
   * Profile link id
   */
  pli: Long;

  /**
   * Special link privilege mask
   */
  pv: LinkPrivilegeMask;

}

export interface OpenLinkChannelUserStruct extends OpenLinkUserStruct {

  userId: Long;

}
