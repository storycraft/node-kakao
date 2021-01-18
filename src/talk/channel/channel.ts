/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { LinkComponent } from "../openlink/open-link";

/**
 * Normal channel
 */
export interface Channel {

    /**
     * Unique channel identifier
     */
    readonly channelId: Long;

}

/**
 * Open chat channel
 */
export interface OpenChannel extends Channel, LinkComponent {

}