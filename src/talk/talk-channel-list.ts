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
  private _normalList: TalkNormalChannelList;
  private _openList: TalkOpenChannelList;

  /**
   * Construct managed channel list
   * @param {TalkSession} session
   * @param {TalkNormalChannel[]} normalList
   * @param {TalkOpenChannel[]} openList
   */
  constructor(
    session: TalkSession,
    normalList: TalkNormalChannel[] = [],
    openList: TalkOpenChannel[] = [],
    clientLinkList: InformedOpenLink[] = [],
  ) {
    super();

    this._normalList = new TalkNormalChannelList(session, normalList);
    this._openList = new TalkOpenChannelList(session, openList, clientLinkList);
  }

  get size(): number {
    return this._normalList.size + this._openList.size;
  }

  /**
   * Normal channel list
   */
  get normalList(): TalkNormalChannelList {
    return this._normalList;
  }

  /**
   * Open channel list
   */
  get openList(): TalkOpenChannelList {
    return this._openList;
  }

  get(channelId: Long): TalkNormalChannel | TalkOpenChannel | undefined {
    return this._normalList.get(channelId) || this._openList.get(channelId);
  }

  all(): ChainedIterator<TalkChannel> {
    const normalIter = this._normalList.all();
    const openIter = this._openList.all();

    return new ChainedIterator<TalkChannel>(normalIter, openIter);
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelListEvents>): void {
    const ctx = new EventContext<OpenChannelListEvents>(this, parentCtx);

    this._normalList.pushReceived(method, data, ctx);
    this._openList.pushReceived(method, data, ctx);
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
      TalkNormalChannelList.initialize(talkChannelList._normalList, normalList),
      TalkOpenChannelList.initialize(talkChannelList._openList, openList),
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
