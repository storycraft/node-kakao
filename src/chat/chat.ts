/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { ChannelUser } from "../user/channel-user";
import { ChatType } from "./chat-type";

/**
 * Chat interface
 */
export interface Chat {

    /**
     * Chat type
     */
    type: ChatType;
    
    /**
     * Cgat text. Can be empty string
     */
    text: string;

    /**
     * Optional attachment json
     */
    attachment?: string;

    /**
     * Optional suppliment json.
     * Only used in Pluschat for extra components(quick reply, custom menus, e.t.c.) and cannot be sent.
     */
    suppliment?: string;

}

export interface ChatLogged {

    /**
     * chat id on server
     */
    readonly logId: Long;

}

export interface ChatLogLinked extends ChatLogged {

    /**
     * Previous logId
     */
    readonly prevLogId: Long;

}

export interface ChatWritten {

    /**
     * Chat sender
     */
    readonly sender: ChannelUser;

    /**
     * Message sent time
     */
    readonly sendAt: number;

    /**
     * Unknown
     */
    readonly messageId: number;

}

export interface ReceivedChat extends Chat, ChatLogLinked, ChatWritten {
    
}

export interface ChatOptions {

    /**
     * Shout option that can be used on OpenChat
     */
    shout?: boolean;

}