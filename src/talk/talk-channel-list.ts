/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelStore, LoginData, NormalChannelData } from '../channel';
import { TalkSession } from './client';
import { EventContext, TypedEmitter } from '../event';
import { InformedOpenLink, OpenChannelData } from '../openlink';
import { DefaultRes } from '../request';
import { ChainedIterator, JsonUtil } from '../util';
import { ChannelListEvents } from './event';
import { Managed } from './managed';
import { TalkOpenChannel, TalkOpenChannelList, TalkOpenChannelListEvents } from './openlink';
import {
  ChannelListUpdater,
  TalkChannel,
  TalkNormalChannel,
  TalkNormalChannelList,
  TalkNormalChannelListEvents
} from './channel';
import { ChannelUserInfo } from '../user';
import { ClientDataLoader } from '../loader';
import { MsgRes, SyncJoinRes } from '../packet/chat';
import { structToChatlog } from '../packet/struct';
import { KnownChatType, KnownFeedType } from '../chat';

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

  async pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<TalkChannelListEvents>): Promise<void> {
    const ctx = new EventContext<TalkChannelListEvents>(this, parentCtx);

    if (method === 'MSG') {
      const msgData = data as DefaultRes & MsgRes;
      if (!this.get(msgData.chatId)) {
        let list: ChannelListUpdater<TalkChannel>;
        if ('li' in msgData) {
          list = this._open;
        } else {
          list = this._normal;
        }

        const res = await list.addChannel({ channelId: msgData.chatId });

        if (res.success) {
          ctx.emit('channel_added', res.result);
        }
      }
    } else if (method === 'SYNCJOIN') {
      const joinData = data as DefaultRes & SyncJoinRes;
      
      if (joinData.chatLog) {
        const chat = structToChatlog(joinData.chatLog);
        
        if (chat.type === KnownChatType.FEED && chat.text) {
          const content = JsonUtil.parseLoseless(chat.text);

          const channel: Channel = { channelId: joinData.c };

          if (content['feedType'] === KnownFeedType.OPENLINK_JOIN) {
            const openRes = await this._open.addChannel(channel);

            if (openRes.success) {
              const childCtx = new EventContext<TalkOpenChannelListEvents>(this._open, ctx);
              childCtx.emit(
                'channel_join',
                openRes.result,
              );
            }
          } else {
            const normalRes = await this._normal.addChannel(channel);

            if (normalRes.success) {
              const childCtx = new EventContext<TalkNormalChannelListEvents>(this._normal, ctx);
              childCtx.emit(
                'channel_join',
                normalRes.result,
              );
            }
          }
        }
      }
    }

    await this._normal.pushReceived(method, data, ctx);
    await this._open.pushReceived(method, data, ctx);
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
