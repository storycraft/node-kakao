/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelList, ChannelTemplate, NormalChannelManageSession } from '../../channel';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import { AsyncCommandResult, CommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import { NormalChannelListEvents } from '../event';
import { Managed } from '../managed';
import { TalkNormalChannel } from './talk-normal-channel';
import { TalkChannelListHandler } from './talk-channel-handler';
import { TalkChannelManageSession } from './talk-channel-session';

/**
 * Manage session channels
 */
export class TalkNormalChannelList
  extends TypedEmitter<NormalChannelListEvents>
  implements ChannelList<TalkNormalChannel>, NormalChannelManageSession, Managed<NormalChannelListEvents> {
    private _handler: TalkChannelListHandler;

    private _manageSession: TalkChannelManageSession;

    private _map: Map<string, TalkNormalChannel>;

    /**
     * Construct managed normal channel list
     * @param {TalkSession} _session
     * @param {TalkNormalChannel[]} list
     */
    constructor(
      private _session: TalkSession,
      list: TalkNormalChannel[],
    ) {
      super();

      this._handler = new TalkChannelListHandler(this, {
        addChannel: (channel) => this.addChannel(channel),
        removeChannel: (channel) => this.delete(channel.channelId),
      });

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

    private async addChannel(channel: Channel): AsyncCommandResult<TalkNormalChannel> {
      const last = this.get(channel.channelId);
      if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

      const strId = channel.channelId.toString();

      const talkChannel = new TalkNormalChannel(channel, this._session);

      const res = await talkChannel.updateAll();
      if (!res.success) return res;

      this._map.set(strId, talkChannel);

      return { success: true, status: res.status, result: talkChannel };
    }

    private delete(channelId: Long) {
      const strId = channelId.toString();

      return this._map.delete(strId);
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

    async leaveChannel(channel: Channel, block?: boolean): Promise<CommandResult<Long>> {
      const res = await this._manageSession.leaveChannel(channel, block);

      if (res.success) {
        this.delete(channel.channelId);
      }

      return res;
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<NormalChannelListEvents>): void {
      const ctx = new EventContext<NormalChannelListEvents>(this, parentCtx);

      for (const channel of this._map.values()) {
        channel.pushReceived(method, data, ctx);
      }

      this._handler.pushReceived(method, data, parentCtx);
    }

    /**
     * Initialize TalkChannelList using channelList.
     * @param {TalkNormalChannelList} talkChannelList
     * @param {Channel[]} channelList
     */
    static async initialize(
        talkChannelList: TalkNormalChannelList,
        channelList: Channel[] = [],
    ): Promise<TalkNormalChannelList> {
      talkChannelList._map.clear();
      await Promise.all(channelList.map((channel) => talkChannelList.addChannel(channel)));

      return talkChannelList;
    }
}
