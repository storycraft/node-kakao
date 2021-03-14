/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelStore, LoginData, NormalChannelData } from '../channel';
import { TalkSession } from './client';
import { EventContext, TypedEmitter } from '../event';
import { InformedOpenLink, OpenChannelData } from '../openlink';
import { DefaultRes } from '../request';
import { ChainedIterator } from '../util';
import { ChannelListEvents } from './event';
import { Managed } from './managed';
import { TalkOpenChannel, TalkOpenChannelList } from './openlink';
import { TalkChannel, TalkNormalChannel, TalkNormalChannelList } from './channel';
import { ChannelUserInfo } from '../user';
import { ClientDataLoader } from '../loader';

type TalkChannelListEvents = ChannelListEvents<TalkChannel, ChannelUserInfo>;

/**
 * Manage normal channels and open channels
 */
export class TalkChannelList
  extends TypedEmitter<TalkChannelListEvents> implements Managed<TalkChannelListEvents>, ChannelStore<TalkChannel> {
  private _normal: TalkNormalChannelList;
  private _open: TalkOpenChannelList;

  /**
   * Construct managed channel list
   * @param {TalkSession} session
   * @param {ClientDataLoader} loader
   * @param {TalkNormalChannel[]} normalList
   * @param {TalkOpenChannel[]} openList
   * @param {InformedOpenLink[]} clientLinkList
   */
  constructor(
    session: TalkSession,
    loader: ClientDataLoader,
    normalList: TalkNormalChannel[] = [],
    openList: TalkOpenChannel[] = [],
    clientLinkList: InformedOpenLink[] = [],
  ) {
    super();

    this._normal = new TalkNormalChannelList(session, loader, normalList);
    this._open = new TalkOpenChannelList(session, loader, openList, clientLinkList);
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

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<TalkChannelListEvents>): void {
    const ctx = new EventContext<TalkChannelListEvents>(this, parentCtx);

    this._normal.pushReceived(method, data, ctx);
    this._open.pushReceived(method, data, ctx);
  }

  /**
   * Initialize TalkChannelList using channelList.
   * @param {TalkChannelList} talkChannelList
   * @param {LoginData<NormalChannelData | OpenChannelData>[]} channelList
   */
  static async initialize(
    talkChannelList: TalkChannelList,
    channelList: LoginData<NormalChannelData | OpenChannelData>[] = [],
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
   * @param {LoginData<NormalChannelData | OpenChannelData>[]} channelList
   * @return {[LoginData<NormalChannelData>[], LoginData<OpenChannelData>[]]}
   */
  static mapChannelList(
    channelList: LoginData<NormalChannelData | OpenChannelData>[]
  ): [LoginData<NormalChannelData>[], LoginData<OpenChannelData>[]] {
    const normalList: LoginData<NormalChannelData>[] = [];
    const openList: LoginData<OpenChannelData>[] = [];

    channelList.forEach((data) => {
      if ('linkId' in data.channel) {
        openList.push(data as LoginData<OpenChannelData>);
      } else {
        normalList.push(data as LoginData<NormalChannelData>);
      }
    });

    return [normalList, openList];
  }
}
