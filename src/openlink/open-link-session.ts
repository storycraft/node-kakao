/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncCommandResult } from '../request';
import {
  InformedOpenLink,
  OpenLinkComponent,
  OpenLink,
  OpenLinkChannelTemplate,
  OpenLinkProfileTemplate,
  OpenLinkCreateTemplate,
  OpenLinkUpdateTemplate,
  OpenLinkProfiles,
} from '.';
import { OpenLinkKickedUser, OpenLinkKickedUserInfo } from './open-link-user-info';
import { OpenChannel } from './open-channel';

export interface OpenLinkSession {

  /**
   * Get latest client link list
   */
  getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]>;

  /**
   * Get openlink from link id.
   *
   * @param components
   */
  getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]>;

  /**
   * Get openlink from link url. This returns more information than getOpenLink method.
   *
   * @param linkURL
   * @param referer Unknown
   */
  getJoinInfo(linkURL: string, referer?: string): AsyncCommandResult<Readonly<InformedOpenLink>>;

  /**
   * Get kicklist of this openlink.
   * Require manage permission otherwise the request fail.
   *
   * @param link
   */
  getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]>;

  /**
   * Remove user from kick list.
   * Require manage permission otherwise the request fail.
   *
   * @param link
   */
  removeKicked(link: OpenLinkComponent, kickedUser: OpenLinkKickedUser): AsyncCommandResult;

  /**
   * Create open channel using template.
   *
   * @param template
   */
  createOpenChannel(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<OpenChannel>;

  /**
   * Create open direct profile using template.
   *
   * @param template
   * @param profile
   */
  createOpenDirectProfile(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<InformedOpenLink>;

  /**
   * Create open profile using template.
   *
   * @param template
   */
  createOpenProfile(template: OpenLinkProfileTemplate & OpenLinkCreateTemplate): AsyncCommandResult<InformedOpenLink>;

  /**
   * Update openlink settings
   *
   * @param link
   * @param settings
   */
  updateOpenLink(
    link: OpenLinkComponent,
    settings: (OpenLinkChannelTemplate | OpenLinkProfileTemplate) & OpenLinkUpdateTemplate
  ): AsyncCommandResult<InformedOpenLink>;

  /**
   * React(Like) to link.
   *
   * @param link
   * @param flag
   */
  react(link: OpenLinkComponent, flag: boolean): AsyncCommandResult;

  /**
   * Get reaction info
   * @param link
   *
   * @returns [ count, clientReacted ]
   */
  getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]>;

  /**
   * Delete openlink.
   * Can only delete owned link.
   *
   * @param link openlink to delete
   */
  deleteLink(link: OpenLinkComponent): AsyncCommandResult;

}
