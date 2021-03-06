/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TypedEmitter } from '../event';
import { ChannelListEvent } from '../talk/event';
import { Channel } from './channel';
import { ChannelListStore } from './store';

/**
 * ChannelList manage specific type of channels or child channel list.
 */
export interface ChannelList<T extends Channel>
extends TypedEmitter<ChannelListEvent>, ChannelListStore<T> {
  
}
