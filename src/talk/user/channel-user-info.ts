/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChatUserPerm } from "../openlink/open-link-type";

/**
 * Channel user info
 */
export interface ChannelUserInfo {

    nickname: string;

}

/**
 * OpenChannel user info
 */
export interface OpenChannelUserInfo extends ChannelUserInfo {

    readonly perm: OpenChatUserPerm;

}