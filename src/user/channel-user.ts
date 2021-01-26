/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { OpenLinkComponent } from "../openlink/open-link";
import { OpenChannelUserPerm } from "../openlink/open-link-type";

/**
 * Channel user
 */
export interface ChannelUser {

    /**
     * Unique identifier
     */
    userId: Long;

}

export interface OpenChannelUser extends ChannelUser, Partial<OpenLinkComponent> {

    

}