/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { OpenLinkComponent } from "../openlink/open-link";
import { OpenChatUserPerm } from "../openlink/open-link-type";

/**
 * Channel user
 */
export interface ChannelUser {

    /**
     * Unique identifier
     */
    readonly userId: Long;

}

export interface OpenChannelUser extends ChannelUser, Partial<OpenLinkComponent> {

    

}