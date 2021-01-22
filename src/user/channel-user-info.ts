/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenChatUserPerm } from "../openlink/open-link-type";
import { ChannelUser, OpenChannelUser } from "./channel-user";

/**
 * Simplified channel user info
 */
export interface SimpleChannelUserInfo extends ChannelUser {

    /**
     * User nickname
     */
    nickname: string;

    /**
     * User profile url
     */
    profileURL?: string;

    /**
     * User country name
     */
    countryIso: string;

}

/**
 * Channel user info
 */
export interface ChannelUserInfo extends SimpleChannelUserInfo {



}

/**
 * OpenChannel user info
 */
export interface OpenChannelUserInfo extends OpenChannelUser, ChannelUserInfo {

    readonly perm: OpenChatUserPerm;

}