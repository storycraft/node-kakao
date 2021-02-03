/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChannelUserPerm, OpenTokenComponent } from '../openlink';
import { ChannelUser, OpenChannelUser } from './channel-user';
import { UserType } from './user-type';

export interface DisplayUserInfo extends ChannelUser {

  /**
   * User nickname
   */
  nickname: string;

  /**
   * User profile url
   */
  profileURL: string;

}

/**
 * Common channel user info
 */
export interface ChannelUserInfo extends DisplayUserInfo {

  /**
   * Full user profile url
   */
  fullProfileURL: string;

  /**
   * Original user profile url
   */
  originalProfileURL: string;

  /**
   * User type
   */
  userType: UserType;

}

/**
 * Normal channel user info
 */
export interface NormalChannelUserInfo extends ChannelUserInfo {

  /**
   * User country name
   */
  countryIso: string;

  /**
   * Account id
   */
  accountId: number;

  /**
   * User status message
   */
  statusMessage: string;

  /**
   * Linked services
   */
  linkedServices: string;

  /**
   * User type(?) unknown
   */
  ut: number;

  /**
   * Account status
   */
  suspended: boolean;

}

/**
 * Open channel user info
 */
export interface OpenChannelUserInfo extends OpenChannelUser, ChannelUserInfo, OpenTokenComponent {

  perm: OpenChannelUserPerm;

}
