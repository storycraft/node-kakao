/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './open-channel-info';
export * from './open-channel-session';
export * from './open-channel';
export * from './open-link-profile';
export * from './open-link-session';
export * from './open-link-type';
export * from './open-link-user-info';
export * from './open-link-service';

import { Long } from 'bson';
import { OpenLinkType } from './open-link-type';
import { OpenLinkUserInfo } from './open-link-user-info';

export interface OpenLinkComponent {

  /**
   * OpenLink id
   */
  linkId: Long;

}

export interface OpenTokenComponent {

  /**
   * Info last update time
   */
  openToken: number;

}

export interface OpenPrivilegeComponent {

  /**
   * Special privilege masks
   */
  privilege: LinkPrivilegeMask;

}

export interface OpenLinkSettings {

  /**
   * Link name
   */
  linkName: string;

  /**
   * Cover image url
   */
  linkCoverURL?: string;

  /**
   * Link description
   */
  description?: string;

  searchable: boolean;

  activated: boolean;

}

/**
 * Contains openlink information
 */
export interface OpenLink
  extends OpenLinkSettings, OpenLinkComponent, OpenTokenComponent, OpenPrivilegeComponent {
  /**
   * Link type
   */
  type: OpenLinkType;

  /**
   * OpenLink url
   */
  linkURL: string;

  /**
   * Open token (Last update time)
   */
  openToken: number;

  /**
   * Owner info
   */
  linkOwner: OpenLinkUserInfo;

  /**
   * Profile tag list
   */
  profileTagList: string[];

  createdAt: number;

}

export interface OpenLinkChannelInfo {

  /**
   * Open channel user limit
   */
  userLimit: number;

}

export interface OpenLinkProfileInfo {

  /**
   * Open profile dm limit
   */
  directLimit: number;

}

/**
 * Extra openlink info
 */
export interface OpenLinkInfo extends OpenLinkChannelInfo, OpenLinkProfileInfo {

}

/**
 * OpenLink with more information
 */
export interface InformedOpenLink {

  openLink: OpenLink;
  info: OpenLinkInfo;

}

export enum KnownLinkPrivilegeMask {

  URL_SHARABLE = 2,
  REPORTABLE = 4,
  PROFILE_EDITABLE = 8,
  ANY_PROFILE_ALLOWED = 32,
  USE_PASS_CODE = 64,
  BLINDABLE = 128,
  NON_SPECIAL_LINK = 512,
  USE_BOT = 1024,

}

export type LinkPrivilegeMask = KnownLinkPrivilegeMask | number | Long;

export interface OpenLinkUpdateTemplate {
  /**
   * link passcode
   */
  passcode?: string;
}

export interface OpenLinkCreateTemplate {
  /**
   * true if anon profile disabled.
   * Unchangable after creating openlink.
   */
  mainProfileOnly?: boolean;
}

/**
 * Openlink profile template
 */
export interface OpenLinkProfileTemplate extends OpenLinkSettings, OpenLinkProfileInfo {

  /**
   * # tag list
   */
  tags: string;

}

/**
 * Openlink channel template
 */
export interface OpenLinkChannelTemplate extends OpenLinkSettings, OpenLinkChannelInfo {

}
