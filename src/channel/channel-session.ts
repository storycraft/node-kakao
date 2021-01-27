/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat, Chatlog, ChatLogged, ChatLogLinked } from "../chat/chat";
import { Channel } from "./channel";
import { AsyncCommandResult, CommandResult } from "../request/command-result";
import { Long } from "..";
import { ChannelUser } from "../user/channel-user";
import { ChannelInfo, ChannelMeta, NormalChannelInfo, SetChannelMeta } from "./channel-info";
import { ChannelMetaType } from "../packet/struct/channel";
import { ChannelUserInfo } from "../user/channel-user-info";
import { ChatOnRoomRes } from "../packet/chat/chat-on-room";
import { MediaDownloader } from "../talk/media/media-downloader";
import { MediaComponent } from "../media/media";
import { ChatType } from "../chat/chat-type";

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
    sendChat(chat: Chat | string): AsyncCommandResult<ChatLogLinked>;

    /**
     * Forward chat to channel.
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
     * @param content
     */
    setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta>;

    /**
     * Get latest channel info
     */
    getLatestChannelInfo(): AsyncCommandResult<ChannelInfo>;

    /**
     * Get latest detailed user info.
     *
     * @param channelUser
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
     * Create media downloader
     *
     * @param media
     * @param type
     */
    createMediaDownloader(media: MediaComponent, type: ChatType): AsyncCommandResult<MediaDownloader>;

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
     * @param userList Users to be included.
     */
    createChannel(template: ChannelTemplate): AsyncCommandResult<Channel>;

    /**
     * Create memo channel.
     * Perform CREATE command.
     */
    createMemoChannel(): AsyncCommandResult<Channel>;

}