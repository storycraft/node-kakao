/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChannelInfo } from "../channel/channel-info";
import { ChatLogged } from "../chat/chat";
import { AsyncCommandResult } from "../request/command-result";
import { ChannelUser } from "../user/channel-user";
import { OpenChannelUserInfo } from "../user/channel-user-info";


/**
 * Classes which provides openchannel session operations should implement this.
 */
export interface OpenChannelSession {

    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): AsyncCommandResult;

    /**
     * Get latest open channel info
     */
    getLatestChannelInfo(): AsyncCommandResult<OpenChannelInfo>;

    /**
     * Get latest detailed user info.
     * @see ChannelSession.getLatestUserInfo
     * 
     * @param channelUser 
     */
    getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]>;
    
    /**
     * Get every latest user info.
     * @see ChannelSession.getAllLatestUserInfo
     * 
     * @param channelUser 
     */
    getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]>;

}