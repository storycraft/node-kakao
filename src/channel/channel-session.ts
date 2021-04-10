/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat, Chatlog, ChatLogged, ChatType } from '../chat';
import { Channel } from './channel';
import { AsyncCommandResult, CommandResult } from '../request';
import { Long } from '..';
import { ChannelUser, NormalChannelUserInfo } from '../user';
import { ChannelMeta, NormalChannelInfo, SetChannelMeta } from './channel-info';
import { ChatOnRoomRes } from '../packet/chat';
import { ChannelMetaType } from './meta';
import { MediaKeyComponent, MediaMultiPost, MediaPost, MediaUploadForm } from '../media';
import { FixedReadStream } from '../stream';

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
  * @param {boolean} [noSeen=true] true if chat should be send without read
  */
  sendChat(chat: Chat | string, noSeen?: boolean): AsyncCommandResult<Chatlog>;

  /**
   * Forward media chat to channel.
   * This command is not intended for chat forwarding.
   *
   * Perform FORWARD command.
   *
   * @param chat
   * @param {boolean} [noSeen=true] true if chat should be send without read
   */
  forwardChat(chat: Chat, noSeen?: boolean): AsyncCommandResult<Chatlog>;

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
   * Set channel meta content
   *
   * @param type
   * @param meta
   */
  setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta>;

  /**
   * Set push alert settings
   *
   * @param flag true to enable
   */
  setPushAlert(flag: boolean): AsyncCommandResult;

  /**
   * Get every chats between startLogId and endLogId.
   * Official client use to fill missing chats between last saved chats and last chat.
   *
   * @param endLogId
   * @param startLogId Omit this param if you don't know start chat logId.
   *
   * @returns Chatlog iterator which iterate chat chunks, including endLogId chat.
   */
  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>>;

  /**
   * Get every chats from next chat of startLogId to end.
   *
   * @param startLogId logId to start.
   */
  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]>;

  /**
   * Create media download stream
   *
   * @param media
   * @param type
   * @param {number} [offset=0] Download start position
   */
  downloadMedia(media: MediaKeyComponent, type: ChatType, offset?: number): AsyncCommandResult<FixedReadStream>;

  /**
   * Create media thumbnail download stream
   *
   * @param media
   * @param type
   * @param {number} [offset=0] Download start position
   */
  downloadMediaThumb(media: MediaKeyComponent, type: ChatType, offset?: number): AsyncCommandResult<FixedReadStream>;

  /**
   * Upload media.
   *
   * @param type Media type. Supports PHOTO, VIDEO, TEXT, FILE type.
   * @param form
   */
  uploadMedia(type: ChatType, form: MediaUploadForm): AsyncCommandResult<MediaPost>;

  /**
   * Upload multi media.
   *
   * @param type Media type. Currently works only with MULTIPHOTO.
   * @param forms
   */
  uploadMultiMedia(type: ChatType, forms: MediaUploadForm[]): AsyncCommandResult<MediaMultiPost>;

}

/**
 * Classes which provides normal channel session operations should implement this.
 */
export interface NormalChannelSession {

  /**
   * Send CHATONROOM and get room infos.
   * Official client sends this and update some infos before opening chatroom window.
   */
  chatON(): AsyncCommandResult<Readonly<ChatOnRoomRes>>;

  /**
   * Get latest channel info
   */
  getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo>;

  /**
   * Get latest detailed user info.
   *
   * @param channelUsers
   */
  getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]>;

  /**
   * Updates every user info to latest.
   * The updated ChannelUserInfo may omit some detailed properties.
   * @see getLatestUserInfo method for getting detailed info per user.
   */
  getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]>;

  /**
   * Invite users to channel.
   *
   * @param userList
   */
  inviteUsers(userList: ChannelUser[]): AsyncCommandResult;

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
