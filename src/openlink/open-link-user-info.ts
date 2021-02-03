/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelUser } from '../user/channel-user';
import { DisplayUserInfo, OpenChannelUserInfo } from '../user/channel-user-info';
import { OpenLinkComponent, OpenPrivilegeComponent, OpenTokenComponent } from '.';
import { OpenChannelUserPerm, OpenProfileType } from './open-link-type';

export interface OpenLinkKickedUser extends ChannelUser {

  /**
   * Kicked channel id
   */
  kickedChannelId: Long;

}

export interface OpenLinkKickedUserInfo extends OpenLinkKickedUser, DisplayUserInfo {


}

export interface OpenLinkUserInfo extends OpenLinkComponent, OpenTokenComponent, OpenPrivilegeComponent {

  /**
   * nickname
   */
  nickname: string;

  /**
   * profile url
   */
  profileURL: string;

  /**
   * Full profile url
   */
  fullProfileURL: string;

  /**
   * Original profile url
   */
  originalProfileURL: string;

  /**
   * Link profile type
   */
  profileType: OpenProfileType;

  /**
   * Link chat user perm
   */
  perm: OpenChannelUserPerm;

}

type OpenChannelUserInfoMix = OpenLinkComponent & OpenChannelUserInfo;
export interface OpenLinkChannelUserInfo extends OpenLinkUserInfo, OpenChannelUserInfoMix {

}
