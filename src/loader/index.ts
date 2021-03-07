/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Channel, NormalChannelInfo, UpdatableChannelDataStore } from '../channel';
import { UpdatableChatListStore } from '../chat';
import { OpenChannel, OpenChannelInfo } from '../openlink';
import { NormalChannelUserInfo, OpenChannelUserInfo } from '../user';

export interface ClientDataLoadResult<T> {

  value: T;

  /**
   * true if value is not loaded or should be updated.
   */
  shouldUpdate: boolean;

}

export type AsyncClientDataLoadResult<T> = Promise<ClientDataLoadResult<T>>;

/**
 * Load various client data from memory or disk file
 */
export interface ClientDataLoader {

  loadChatListStore(channel: Channel): AsyncClientDataLoadResult<UpdatableChatListStore>;

  loadNormalChannelStore(
    channel: Channel,
    lastUpdate?: number
  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>>;

  loadOpenChannelStore(
    channel: OpenChannel,
    lastUpdate?: number
  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>>;

}