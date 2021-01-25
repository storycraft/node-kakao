/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatLogged } from "../chat/chat";
import { AsyncCommandResult } from "../request/command-result";
import { ChannelUser } from "../user/channel-user";
import { OpenChannelUserInfo } from "../user/channel-user-info";
import { OpenChannelInfo } from "./open-channel-info";
import { OpenLink } from "./open-link";


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

    /**
     * Get latest channel openlink
     */
    getLatestOpenLink(): AsyncCommandResult<OpenLink>;

}