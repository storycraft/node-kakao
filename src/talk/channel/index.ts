/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from "./talk-channel-handler";
export * from "./talk-channel-list";
export * from "./talk-channel-session";
export * from "./talk-normal-channel";
export * from "./talk-normal-channel-list";

import { Channel } from "../../channel/channel";
import { ChannelInfo } from "../../channel/channel-info";
import { ChannelSession } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo } from "../../user/channel-user-info";
import { ChatLogged } from "../../chat/chat";
import { AsyncCommandResult } from "../../request";
import { TypedEmitter } from "tiny-typed-emitter";
import { ChannelEvents } from "../event/events";

export interface TalkChannel extends Channel, ChannelSession, TypedEmitter<ChannelEvents> {

    /**
     * Channel info snapshot.
     * Info object may change when some infos updated.
     */
    readonly info: Readonly<ChannelInfo>;

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

}
