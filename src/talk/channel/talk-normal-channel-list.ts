/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import {
  Channel,
  ChannelStore,
  ChannelTemplate,
  LoginData,
  NormalChannelData,
  NormalChannelManageSession
} from '../../channel';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import { AsyncCommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import { NormalChannelListEvents } from '../event';
import { Managed } from '../managed';
import { TalkNormalChannel } from './talk-normal-channel';
import { ChannelListUpdater, TalkChannelListHandler } from './talk-channel-handler';
import { NormalChannelUserInfo } from '../../user';
import { TalkChannelManageSession } from './talk-channel-session';
import { ClientDataLoader } from '../../loader';
import { updateChatList } from './common';

export type TalkNormalChannelListEvents = NormalChannelListEvents<TalkNormalChannel, NormalChannelUserInfo>;

/**
 * Manage session channels
 */
export class TalkNormalChannelList
  extends TypedEmitter<TalkNormalChannelListEvents>
  implements ChannelStore<TalkNormalChannel>, NormalChannelManageSession, Managed<TalkNormalChannelListEvents>,
  ChannelListUpdater<TalkNormalChannel> {

  private _handler: TalkChannelListHandler<TalkNormalChannel>;

  private _manageSession: TalkChannelManageSession;

  private _map: Map<string, TalkNormalChannel>;

  /**
   * Construct managed normal channel list
   * @param {TalkSession} _session
   * @param {ClientDataLoader} _loader
   * @param {TalkNormalChannel[]} list
   */
  constructor(
    private _session: TalkSession,
    private _loader: ClientDataLoader,
    list: TalkNormalChannel[],
  ) {
    super();

    this._handler = new TalkChannelListHandler(this, this, this);

    this._manageSession = new TalkChannelManageSession(_session);

    this._map = new Map();
    if (list.length > 0) {
      list.forEach((channel) => this._map.set(channel.channelId.toString(), channel));
    }
  }

  get size(): number {
    return this._map.size;
  }

  get(channelId: Long): TalkNormalChannel | undefined {
    const strId = channelId.toString();

    return this._map.get(strId);
  }

  all(): IterableIterator<TalkNormalChannel> {
    return this._map.values();
  }

  async addChannel(channel: Channel, lastUpdate?: number): AsyncCommandResult<TalkNormalChannel> {
    const last = this.get(channel.channelId);
    if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

    const strId = channel.channelId.toString();

    const infoStoreRes = await this._loader.loadNormalChannelStore(channel, lastUpdate);
    const chatStoreRes = await this._loader.loadChatListStore(channel);

    const talkChannel = new TalkNormalChannel(
      channel,
      this._session,
      infoStoreRes.value,
      chatStoreRes.value
    );

    this._map.set(strId, talkChannel);

    if (infoStoreRes.shouldUpdate) {
      const res = await talkChannel.updateAll();
      if (!res.success) return res;
    }

    if (chatStoreRes.shouldUpdate) {
      await updateChatList(talkChannel);
    }

    return { success: true, status: KnownDataStatusCode.SUCCESS, result: talkChannel };
  }

  removeChannel(channel: Channel): boolean {
    return this._map.delete(channel.channelId.toString());
  }

  async createChannel(template: ChannelTemplate): AsyncCommandResult<TalkNormalChannel> {
    const res = await this._manageSession.createChannel(template);
    if (!res.success) return res;

    return this.addChannel(res.result);
  }

  async createMemoChannel(): AsyncCommandResult<TalkNormalChannel> {
    const res = await this._manageSession.createMemoChannel();
    if (!res.success) return res;

    return this.addChannel(res.result);
  }

  async leaveChannel(channel: Channel, block?: boolean): AsyncCommandResult<Long> {
    const res = await this._manageSession.leaveChannel(channel, block);

    if (res.success) {
      this.removeChannel(channel);
    }

    return res;
  }

  async pushReceived(
    method: string,
    data: DefaultRes,
    parentCtx: EventContext<TalkNormalChannelListEvents>
  ): Promise<void> {
    const ctx = new EventContext<TalkNormalChannelListEvents>(this, parentCtx);

    await Promise.all(Array.from(this._map.values()).map((channel) => channel.pushReceived(method, data, ctx)));

    await this._handler.pushReceived(method, data, parentCtx);
  }

  /**
   * Initialize TalkChannelList using channelList.
   * @param {TalkNormalChannelList} talkChannelList
   * @param {LoginData<NormalChannelData>[]} channelList
   */
  static async initialize(
    talkChannelList: TalkNormalChannelList,
    channelList: LoginData<NormalChannelData>[] = [],
  ): Promise<TalkNormalChannelList> {
    talkChannelList._map.clear();
    await Promise.all(channelList.map((data) => talkChannelList.addChannel(data.channel, data.lastUpdate)));

    return talkChannelList;
  }
}
