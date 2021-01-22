/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Chatlog } from "../chat/chat";
import { OpenTokenComponent } from "../openlink/open-link";
import { SimpleChannelUserInfo } from "../user/channel-user-info";
import { Channel, OpenChannel } from "./channel";
import { ChannelType } from "./channel-type";

export interface ChannelMeta {

    content: string;

}

export interface SetChannelMeta extends ChannelMeta {
    
    revision: number;

    authorId: Long;

    updatedAt: number;

}

export interface ChannelMetaMap extends Record<ChannelType, SetChannelMeta> {

}

/**
 * Common channel info
 */
export interface ChannelInfo extends Channel {

    /**
     * Channel type
     */
    readonly type: ChannelType;

    /**
     * Active user count
     */
    readonly activeUserCount: number;

    /**
     * Unread chat count
     */
    readonly newChatCount: number;

    /**
     * true if new chat count is invalid
     */
    readonly newChatCountInvalid: boolean;
    
    /**
     * Last chat log id
     */
    readonly lastChatLogId: Long;

    /**
     * Last seen chat log id
     */
    readonly lastSeenLogId: Long;

    /**
     * Last chatlog
     */
    readonly lastChatLog?: Chatlog;

    // readonly clientMeta?: ChannelClientMetaStruct;

    readonly metaMap: ChannelMetaMap;

    readonly displayUserList: SimpleChannelUserInfo[];

    /**
     * Push alert settings
     */
    readonly pushAlert: boolean;

}

/**
 * Normal channel info
 */
export interface NormalChannelInfo extends ChannelInfo {

    /**
     * Channel join time (js Date timestamp)
     */
    readonly joinTime: number;

}

/** 
 * Open channel info
 */
export interface OpenChannelInfo extends ChannelInfo, OpenChannel, OpenTokenComponent {

    /**
     * true if direct channel
     */
    readonly directChannel: boolean;

    /**
     * Unknown
     */
    readonly o: Long;

}