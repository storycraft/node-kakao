/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './common';
export * from './talk-channel-handler';
export * from './talk-channel-session';
export * from './talk-normal-channel';
export * from './talk-normal-channel-list';

import { Channel, ChannelData, ChannelSession } from '../../channel';
import { ChannelUser, ChannelUserInfo } from '../../user';
import { AsyncCommandResult } from '../../request';
import { TypedEmitter } from '../../event';
import { ChannelEvents } from '../event';
import {
  GroupMetaContent,
  LiveTalkCountMetaContent,
  LiveTalkInfoMetaContent,
  ProfileMetaContent,
  TvLiveMetaContent,
  TvMetaContent,
} from '../../channel/meta';
import { Chatlog, ChatLogged, ChatType } from '../../chat';
import { MediaUploadTemplate } from '../media';

/**
 * TalkChannel interface includes managed methods and other methods that make it easier to use
 */
export interface TalkChannel extends Channel, ChannelData, ChannelSession, TypedEmitter<ChannelEvents> {

  /**
   * Get client user
   */
  readonly clientUser: Readonly<ChannelUser>;

  /**
   * Get channel name
   */
  getName(): string;

  /**
   * Get displayed channel name
   */
  getDisplayName(): string;

  /**
   * Get channel user info
   *
   * @param user User to find
   */
  getUserInfo(user: ChannelUser): Readonly<ChannelUserInfo> | undefined;

  /**
   * Get user info iterator
   */
  getAllUserInfo(): IterableIterator<ChannelUserInfo>;

  /**
   * Get total user count
   */
  readonly userCount: number;

  /**
   * Get read count of the chat.
   * This may not work correctly on channel with many users. (99+)
   *
   * @param chat
   */
  getReadCount(chat: ChatLogged): number;

  /**
   * Get readers in this channel.
   * This may not work correctly on channel with many users. (99+)
   *
   * @param chat
   */
  getReaders(chat: ChatLogged): Readonly<ChannelUserInfo>[];

  /**
   * Update channel info and every user info
   */
  updateAll(): AsyncCommandResult;

  /**
   * Set channel title
   *
   * @param title
   */
  setTitleMeta(title: string): AsyncCommandResult;

  /**
   * Set channel notice
   *
   * @param notice
   */
  setNoticeMeta(notice: string): AsyncCommandResult;

  /**
   * Set channel profile
   *
   * @param content
   */
  setProfileMeta(content: ProfileMetaContent): AsyncCommandResult;

  /**
   * Set channel tv meta
   *
   * @param content
   */
  setTvMeta(content: TvMetaContent): AsyncCommandResult;

  /**
   * Set channel tv live meta
   *
   * @param content
   */
  setTvLiveMeta(content: TvLiveMetaContent): AsyncCommandResult;

  /**
   * Set live talk count meta
   *
   * @param content
   */
  setLiveTalkCountMeta(content: LiveTalkCountMetaContent): AsyncCommandResult;

  /**
   * Set live talk info meta
   *
   * @param content
   */
  setLiveTalkInfoMeta(content: LiveTalkInfoMetaContent): AsyncCommandResult;

  /**
   * Set group profile meta
   *
   * @param content
   */
  setGroupMeta(content: GroupMetaContent): AsyncCommandResult;

  /**
   * Upload media and send.
   *
   * @param type
   * @param template
   */
  sendMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<Chatlog>;

  /**
   * Upload multi media and send.
   *
   * @param type
   * @param templates
   */
  sendMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<Chatlog>;

}
