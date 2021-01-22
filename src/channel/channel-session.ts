/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../packet/bson-data-codec";
import { Chat, ChatLogged } from "../chat/chat";
import { Channel } from "./channel";
import { CommandResult } from "../request/command-result";
import { Long } from "..";
import { ChannelUser } from "../user/channel-user";
import { ChannelInfo, NormalChannelInfo, OpenChannelInfo } from "./channel-info";

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
    sendChat(chat: Chat | string): Promise<DefaultRes>;

    /**
     * Forward chat to channel.
     * Perform FORWARD command.
     * 
     * @param chat 
     */
    forwardChat(chat: Chat): Promise<DefaultRes>;

    /**
     * Delete chat from server.
     * It only works to client user chat.
     * 
     * @param chat Chat to delete
     */
    deleteChat(chat: ChatLogged): Promise<CommandResult>;
    
    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): Promise<CommandResult>;

    /**
     * Get latest channel info
     */
    getChannelInfo(): Promise<CommandResult<ChannelInfo>>;

}

/**
 * Classes which can manage channels should implement this. 
 */
export interface ChannelManageSession {

    /**
     * Create channel.
     * Perform CREATE command.
     * 
     * @param userList Users to be included.
     */
    createChannel(template: ChannelTemplate): Promise<CommandResult<[Channel, NormalChannelInfo | null]>>;

    /**
     * Create memo channel.
     * Perform CREATE command.
     */
    createMemoChannel(): Promise<CommandResult<[Channel, NormalChannelInfo | null]>>;

   /**
    * Leave channel.
    * Perform LEAVE command.
    * Returns last channel token on success.
    * 
    * @param channel Channel to leave.
    * @param block If true block channel to prevent inviting.
    */
    leaveChannel(channel: Channel, block?: boolean): Promise<CommandResult<Long>>;

}

/**
 * Classes which provides openchannel session operations should implement this.
 */
export interface OpenChannelSession {

    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): Promise<CommandResult>;

    /**
     * Get latest open channel info
     */
    getChannelInfo(): Promise<CommandResult<OpenChannelInfo>>;

}