/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { NormalChannelInfo, UpdatableChannelDataStore } from '../channel';
import { UpdatableChatListStore } from '../chat';
import { AsyncClientDataLoadResult, ClientDataLoader } from '../loader';
import { OpenChannelInfo } from '../openlink';
import { NormalChannelUserInfo, OpenChannelUserInfo } from '../user';
import { TalkMemoryChannelDataStore } from './channel';
import { TalkMemoryChatListStore } from './chat';

export const TalkInMemoryDataLoader: ClientDataLoader = {

  async loadChatListStore(): AsyncClientDataLoadResult<UpdatableChatListStore> {
    return {
      shouldUpdate: false,
      value: new TalkMemoryChatListStore(300)
    }
  },

  async loadNormalChannelStore(

  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>> {
    return {
      shouldUpdate: true,
      value: new TalkMemoryChannelDataStore(NormalChannelInfo.createPartial({}))
    };
  },

  async loadOpenChannelStore(

  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>> {
    return {
      shouldUpdate: true,
      value: new TalkMemoryChannelDataStore(OpenChannelInfo.createPartial({}))
    };
  }

}