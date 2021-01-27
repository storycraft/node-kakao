/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { TypedEmitter } from "../event/event-context";
import { ChannelListEvents } from "../talk/event/events";
import { Channel } from "./channel";

/**
 * ChannelList manage speific type of channels or child channel list.
 */
export interface ChannelList<T extends Channel> extends TypedEmitter<ChannelListEvents> {

    /**
     * Try to get channel instance with channel id
     * 
     * @param channelId 
     */
    get(channelId: Long): T | undefined;

    /**
     * Iterate every channel list
     */
    all(): IterableIterator<T>;

    /**
     * Total channel count
     */
    readonly size: number;

}