/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat, Chatlog, ChatLogged, ChatType } from '../chat';
import { Channel } from './channel';
import { AsyncCommandResult, CommandResult } from '../request';
import { Long } from '..';
import { ChannelUser, ChannelUserInfo } from '../user';
import { ChannelInfo, ChannelMeta, SetChannelMeta } from './channel-info';
import { ChatOnRoomRes } from '../packet/chat';
import { MediaDownloader, MediaUploader, MultiMediaUploader, MediaUploadTemplate } from '../talk';
import { MediaKeyComponent } from '../media';
import { ChannelMetaType } from './meta';

export interface ChannelTemplate {

  userList: ChannelUser[],

  name?: string;
  profileURL?: string;

}

/**
 * Classes which provides channel session operations should implement this.
 */
export interface ChannelSession {

  /**
  * Send chat to channel.
  * Perform WRITE command.
  *
  * @param chat
   */
  sendChat(chat: Chat | string): AsyncCommandResult<Chatlog>;

  /**
   * Forward media chat to channel.
   * This command is not intended for chat forwarding.
   *
   * Perform FORWARD command.
   *
   * @param chat
   */
  forwardChat(chat: Chat): AsyncCommandResult<Chatlog>;

  /**
   * Delete chat from server.
   * It only works to client user chat.
   *
   * @param chat Chat to delete
   */
  deleteChat(chat: ChatLogged): AsyncCommandResult;

  /**
   * Mark every chat read until this chat.
   * @param chat
   */
  markRead(chat: ChatLogged): AsyncCommandResult;

  /**
   * Send CHATONROOM and get room infos.
   * Official client sends this and update some infos before opening chatroom window.
   */
  chatON(): AsyncCommandResult<Readonly<ChatOnRoomRes>>;

  /**
   * Set channel meta content
   *
   * @param type
   * @param meta
   */
  setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta>;

  /**
   * Get latest channel info
   */
  getLatestChannelInfo(): AsyncCommandResult<ChannelInfo>;

  /**
   * Get latest detailed user info.
   *
   * @param channelUsers
   */
  getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<ChannelUserInfo[]>;

  /**
   * Updates every user info to latest.
   * The updated ChannelUserInfo may omit some detailed properties.
   * @see getLatestUserInfo method for getting detailed info per user.
   */
  getAllLatestUserInfo(): AsyncCommandResult<ChannelUserInfo[]>;

  /**
   * Set push alert settings
   *
   * @param flag true to enable
   */
  setPushAlert(flag: boolean): AsyncCommandResult;

  /**
   * Invite users to channel.
   *
   * @param userList
   */
  inviteUsers(userList: ChannelUser[]): AsyncCommandResult;

  /**
   * Get every chats between startLogId and endLogId.
   * Official client use to fill missing chats between last saved chats and last chat.
   *
   * @param endLogId
   * @param startLogId Omit this param if you don't know start chat logId.
   *
   * @returns Chatlog iterator which iterate chat chunks, excluding startLogId and endLogId chat.
   */
  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>>;

  /**
   * Get every chats from next chat of startLogId to end.
   *
   * @param startLogId logId to start.
   */
  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]>;

  /**
   * Create media downloader
   *
   * @param media
   * @param type
   */
  downloadMedia(media: MediaKeyComponent, type: ChatType): AsyncCommandResult<MediaDownloader>;

  /**
   * Create media uploader.
   *
   * @param type Media type. Supports PHOTO, VIDEO, TEXT, FILE type.
   * @param template
   */
  uploadMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<MediaUploader>;

  /**
   * Create multi media uploader.
   *
   * @param type Media type. Currently works only with MULTIPHOTO.
   * @param templates
   */
  uploadMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<MultiMediaUploader[]>;

}

export interface ChannelManageSession {

  /**
   * Leave channel.
   * Perform LEAVE command.
   *
   * @param channel Channel to leave.
   * @param block If true block channel to prevent inviting.
   *
   * @returns last channel token on success.
   */
  leaveChannel(channel: Channel, block?: boolean): AsyncCommandResult<Long>;

}

/**
 * Classes which can manage normal channels should implement this.
 */
export interface NormalChannelManageSession extends ChannelManageSession {

  /**
   * Create channel.
   * Perform CREATE command.
   *
   * @param template
   */
  createChannel(template: ChannelTemplate): AsyncCommandResult<Channel>;

  /**
   * Create memo channel.
   * Perform CREATE command.
   */
  createMemoChannel(): AsyncCommandResult<Channel>;

}
