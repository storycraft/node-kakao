/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChatUserPerm } from "../openlink/open-link-type";
import { ChannelUser, OpenChannelUser } from "./channel-user";

/**
 * Channel user info
 */
export interface ChannelUserInfo extends ChannelUser {

    nickname: string;

}

/**
 * OpenChannel user info
 */
export interface OpenChannelUserInfo extends OpenChannelUser, ChannelUserInfo {

    readonly perm: OpenChatUserPerm;

}