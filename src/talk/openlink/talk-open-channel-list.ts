/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelStore, LoginData } from '../../channel';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import {
  InformedOpenLink,
  OpenChannel,
  OpenChannelData,
  OpenChannelManageSession,
  OpenLink,
  OpenLinkChannelTemplate,
  OpenLinkComponent,
  OpenLinkCreateTemplate,
  OpenLinkKickedUser,
  OpenLinkKickedUserInfo,
  OpenLinkProfiles,
  OpenLinkProfileTemplate,
  OpenLinkService,
  OpenLinkSession,
  OpenLinkUpdateTemplate,
} from '../../openlink';
import { AsyncCommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import { ChannelListUpdater, TalkChannelListHandler, updateChatList } from '../channel';
import { OpenChannelListEvents } from '../event';
import { Managed } from '../managed';
import { TalkOpenChannel } from './talk-open-channel';
import { TalkOpenChannelListHandler } from './talk-open-channel-handler';
import { TalkOpenChannelManageSession } from './talk-open-channel-session';
import { OpenLinkUpdater } from './talk-open-link-handler';
import { OpenChannelUserInfo } from '../../user';
import { ClientDataLoader } from '../../loader';
import { TalkClientLinkStore } from './client-link-store';

export type TalkOpenChannelListEvents = OpenChannelListEvents<TalkOpenChannel, OpenChannelUserInfo>;

/**
 * Manage open profile, channel.
 */
export class TalkOpenChannelList
  extends TypedEmitter<TalkOpenChannelListEvents>
  implements Managed<TalkOpenChannelListEvents>, OpenChannelManageSession,
  ChannelStore<TalkOpenChannel>, OpenLinkSession,
  ChannelListUpdater<TalkOpenChannel>, OpenLinkUpdater {

  private _handler: TalkChannelListHandler<TalkOpenChannel>;
  private _openHandler: TalkOpenChannelListHandler<TalkOpenChannel, OpenChannelUserInfo>;
  private _linkStore: TalkClientLinkStore;
  
  private _manageSession: TalkOpenChannelManageSession;

  private _map: Map<string, TalkOpenChannel>;

  constructor(
    private _session: TalkSession,
    private _loader: ClientDataLoader,
    list: TalkOpenChannel[],
    clientLinkList: InformedOpenLink[],
  ) {
    super();

    this._manageSession = new TalkOpenChannelManageSession(_session);

    this._handler = new TalkChannelListHandler(this, this, this);
    this._openHandler = new TalkOpenChannelListHandler(this, this, this);
    this._linkStore = new TalkClientLinkStore(_session, clientLinkList);

    this._map = new Map();
    if (list.length > 0) {
      list.forEach((channel) => this._map.set(channel.channelId.toString(), channel));
    }
  }

  get linkService(): OpenLinkService {
    return this._linkStore;
  }

  /**
   * @param {InformedOpenLink} link
   * @deprecated
   */
  addClientLink(link: InformedOpenLink): void {
    this._linkStore.addClientLink(link);
  }

  /**
   * @param {Long} linkId
   * @return {boolean}
   * @deprecated
   */
  deleteClientLink(linkId: Long): boolean {
    return this._linkStore.deleteClientLink(linkId);
  }

  removeChannel(channel: Channel): boolean {
    return this._map.delete(channel.channelId.toString());
  }

  async addChannel(channel: Channel): AsyncCommandResult<TalkOpenChannel> {
    return this.addOpenChannel({ ...channel, linkId: Long.ZERO });
  }

  get(channelId: Long): TalkOpenChannel | undefined {
    return this._map.get(channelId.toString());
  }

  /**
   * Find open channel using linkId
   *
   * @deprecated
   * @param {Long} linkId
   * @return {TalkOpenChannel | undefined}
   */
  getChannelByLinkId(linkId: Long): TalkOpenChannel | undefined {
    for (const channel of this.all()) {
      if (channel.linkId.eq(linkId)) return channel;
    }
  }

  /**
   * Find all open channel using same linkId
   *
   * @param {Long} linkId
   * @return {TalkOpenChannel[]}
   */
  getLinkChannelList(linkId: Long): TalkOpenChannel[] {
    const list: TalkOpenChannel[] = [];

    for (const channel of this.all()) {
      if (channel.linkId.eq(linkId)) list.push(channel);
    }

    return list;
  }

  get size(): number {
    return this._map.size;
  }

  all(): IterableIterator<TalkOpenChannel> {
    return this._map.values();
  }

  /**
   * @return {IterableIterator<InformedOpenLink>}
   * @deprecated
   */
  allClientLink(): IterableIterator<InformedOpenLink> {
    return this._linkStore.allClientLink();
  }

  /**
   * @param {Long} linkId
   * @return {InformedOpenLink | undefined}
   * @deprecated
   */
  getClientLink(linkId: Long): InformedOpenLink | undefined {
    return this._linkStore.getClientLink(linkId);
  }

  /**
   * @deprecated
   */
  get clientLinkCount(): number {
    return this._linkStore.clientLinkCount;
  }

  async addOpenChannel(channel: OpenChannel, lastUpdate?: number): AsyncCommandResult<TalkOpenChannel> {
    const last = this.get(channel.channelId);
    if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

    const infoStoreRes = await this._loader.loadOpenChannelStore(channel, lastUpdate);
    const chatStoreRes = await this._loader.loadChatListStore(channel);

    const talkChannel = new TalkOpenChannel(
      channel,
      this._session,
      infoStoreRes.value,
      chatStoreRes.value
    );

    this._map.set(channel.channelId.toString(), talkChannel);

    if (infoStoreRes.shouldUpdate) {
      const res = await talkChannel.updateAll();
      if (!res.success) return res;
    }

    if (chatStoreRes.shouldUpdate) {
      await updateChatList(talkChannel);
    }

    return { success: true, status: KnownDataStatusCode.SUCCESS, result: talkChannel };
  }

  async leaveKicked(channel: OpenChannel): AsyncCommandResult {
    const res = await this._manageSession.leaveKicked(channel);
    if (res.success) {
      this._map.delete(channel.channelId.toString());
    }

    return res;
  }

  async leaveChannel(channel: Channel): AsyncCommandResult<Long> {
    const res = await this._manageSession.leaveChannel(channel);
    if (res.success) {
      this._map.delete(channel.channelId.toString());
    }

    return res;
  }

  getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
    return this._linkStore.getLatestLinkList();
  }

  getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]> {
    return this._linkStore.getOpenLink(...components);
  }

  getJoinInfo(linkURL: string, referer?: string): AsyncCommandResult<Readonly<InformedOpenLink>> {
    return this._linkStore.getJoinInfo(linkURL, referer);
  }

  getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._linkStore.getKickList(link);
  }

  removeKicked(link: OpenLinkComponent, kickedUser: OpenLinkKickedUser): AsyncCommandResult {
    return this._linkStore.removeKicked(link, kickedUser);
  }

  async deleteLink(link: OpenLinkComponent): AsyncCommandResult {
    const res = await this._linkStore.deleteLink(link);

    if (res.success) {
      this._linkStore.deleteClientLink(link.linkId);
      for (const channel of this.getLinkChannelList(link.linkId)) {
        this.removeChannel(channel);
      }
    }

    return res;
  }

  react(link: OpenLinkComponent, flag: boolean): AsyncCommandResult {
    return this._linkStore.react(link, flag);
  }

  getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
    return this._linkStore.getReaction(link);
  }

  async createOpenChannel(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<TalkOpenChannel> {
    const res = await this._linkStore.createOpenChannel(template, profile);
    if (!res.success) return res;

    return this.addOpenChannel(res.result);
  }

  createOpenDirectProfile(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<InformedOpenLink> {
    return this._linkStore.createOpenDirectProfile(template, profile);
  }

  createOpenProfile(
    template: OpenLinkProfileTemplate & OpenLinkCreateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    return this._linkStore.createOpenProfile(template);
  }

  updateOpenLink(
    link: OpenLinkComponent,
    settings: (OpenLinkChannelTemplate | OpenLinkProfileTemplate) & OpenLinkUpdateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    return this._linkStore.updateOpenLink(link, settings);
  }

  async pushReceived(
    method: string,
    data: DefaultRes,
    parentCtx: EventContext<TalkOpenChannelListEvents>
  ): Promise<void> {
    const ctx = new EventContext<TalkOpenChannelListEvents>(this, parentCtx);

    await Promise.all(Array.from(this._map.values()).map((channel) => channel.pushReceived(method, data, ctx)));

    await this._handler.pushReceived(method, data, parentCtx);
    await this._openHandler.pushReceived(method, data, parentCtx);
    await this._linkStore.pushReceived(method, data, parentCtx);
  }

  async joinChannel(
    link: OpenLinkComponent,
    profile: OpenLinkProfiles,
    passcode?: string,
  ): AsyncCommandResult<TalkOpenChannel> {
    const res = await this._manageSession.joinChannel(link, profile, passcode);

    if (!res.success) return res;

    return this.addOpenChannel(res.result);
  }

  /**
   * Initialize TalkChannelList using channelList.
   * @param {TalkOpenChannelList} talkChannelList
   * @param {LoginData<OpenChannelData>[]} channelList
   */
  static async initialize(
    talkChannelList: TalkOpenChannelList,
    channelList: LoginData<OpenChannelData>[] = [],
  ): Promise<TalkOpenChannelList> {
    talkChannelList._map.clear();

    await Promise.all(channelList.map((data) => talkChannelList.addOpenChannel(data.channel, data.lastUpdate)));
    await talkChannelList._linkStore.getLatestLinkList();

    return talkChannelList;
  }
}
