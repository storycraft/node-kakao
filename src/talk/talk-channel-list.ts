/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelList } from '../channel';
import { TalkSession } from './client';
import { EventContext, TypedEmitter } from '../event';
import { InformedOpenLink, OpenChannel } from '../openlink';
import { DefaultRes } from '../request';
import { ChainedIterator } from '../util';
import { OpenChannelListEvents, TalkChannelListEvents } from './event';
import { Managed } from './managed';
import { TalkOpenChannel, TalkOpenChannelList } from './openlink';
import { TalkChannel, TalkNormalChannel, TalkNormalChannelList } from './channel';

/**
 * Manage normal channels and open channels
 */
export class TalkChannelList
  extends TypedEmitter<TalkChannelListEvents> implements Managed<TalkChannelListEvents>, ChannelList<TalkChannel> {
  private _normal: TalkNormalChannelList;
  private _open: TalkOpenChannelList;

  /**
   * Construct managed channel list
   * @param {TalkSession} session
   * @param {TalkNormalChannel[]} normalList
   * @param {TalkOpenChannel[]} openList
   * @param {InformedOpenLink[]} clientLinkList
   */
  constructor(
    session: TalkSession,
    normalList: TalkNormalChannel[] = [],
    openList: TalkOpenChannel[] = [],
    clientLinkList: InformedOpenLink[] = [],
  ) {
    super();

    this._normal = new TalkNormalChannelList(session, normalList);
    this._open = new TalkOpenChannelList(session, openList, clientLinkList);
  }

  get size(): number {
    return this._normal.size + this._open.size;
  }

  /**
   * Normal channel list
   */
  get normal(): TalkNormalChannelList {
    return this._normal;
  }

  /**
   * Open channel list
   */
  get open(): TalkOpenChannelList {
    return this._open;
  }

  get(channelId: Long): TalkNormalChannel | TalkOpenChannel | undefined {
    return this._normal.get(channelId) || this._open.get(channelId);
  }

  all(): ChainedIterator<TalkChannel> {
    const normalIter = this._normal.all();
    const openIter = this._open.all();

    return new ChainedIterator<TalkChannel>(normalIter, openIter);
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelListEvents>): void {
    const ctx = new EventContext<OpenChannelListEvents>(this, parentCtx);

    this._normal.pushReceived(method, data, ctx);
    this._open.pushReceived(method, data, ctx);
  }

  /**
   * Initialize TalkChannelList using channelList.
   * @param {TalkChannelList} talkChannelList
   * @param {(Channel | OpenChannel)[]} channelList
   */
  static async initialize(
    talkChannelList: TalkChannelList,
    channelList: (Channel | OpenChannel)[] = [],
  ): Promise<TalkChannelList> {
    const [normalList, openList] = TalkChannelList.mapChannelList(channelList);

    await Promise.all([
      TalkNormalChannelList.initialize(talkChannelList._normal, normalList),
      TalkOpenChannelList.initialize(talkChannelList._open, openList),
    ]);

    return talkChannelList;
  }

  /**
   * Split normal channel and open channel
   *
   * @param {(Channel | OpenChannel)[]} channelList
   * @return {[Channel[], OpenChannel[]]}
   */
  static mapChannelList(channelList: (Channel | OpenChannel)[]): [Channel[], OpenChannel[]] {
    const normalList: Channel[] = [];
    const openList: OpenChannel[] = [];
    channelList.forEach((channel) => {
      if ('linkId' in channel) {
        openList.push(channel);
      } else {
        normalList.push(channel);
      }
    });

    return [normalList, openList];
  }
}
