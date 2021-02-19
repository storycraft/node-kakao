/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelList } from '../../channel';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import {
  InformedOpenLink,
  OpenChannel,
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
import { ChannelListUpdater, TalkChannelListHandler } from '../channel';
import { OpenChannelListEvents } from '../event';
import { Managed } from '../managed';
import { TalkOpenChannel } from './talk-open-channel';
import { TalkOpenChannelListHandler } from './talk-open-channel-handler';
import { TalkOpenChannelManageSession } from './talk-open-channel-session';
import { TalkOpenLinkSession } from './talk-open-link-session';
import { OpenLinkUpdater, TalkOpenLinkHandler } from './talk-open-link-handler';

/**
 * Manage open profile, channel.
 */
export class TalkOpenChannelList
  extends TypedEmitter<OpenChannelListEvents>
  implements Managed<OpenChannelListEvents>, OpenChannelManageSession,
  ChannelList<TalkOpenChannel>, OpenLinkSession, OpenLinkService {
  private _handler: TalkChannelListHandler;
  private _openHandler: TalkOpenChannelListHandler;
  private _linkHandler: TalkOpenLinkHandler;

  private _linkSession: TalkOpenLinkSession;
  private _manageSession: TalkOpenChannelManageSession;

  private _map: Map<string, TalkOpenChannel>;
  private _clientMap: Map<string, InformedOpenLink>;

  constructor(
    private _session: TalkSession,
    list: TalkOpenChannel[],
    clientLinkList: InformedOpenLink[],
  ) {
    super();

    const infoUpdater: ChannelListUpdater<TalkOpenChannel> & OpenLinkUpdater = {
      addChannel: (channel) => this.addChannel(channel),
      removeChannel: (channel) => this.deleteChannel(channel.channelId),
      addClientLink: (link) => this._clientMap.set(link.openLink.linkId.toString(), link),
      deleteClientLink: (linkId) => this._clientMap.delete(linkId.toString()),
    };

    this._manageSession = new TalkOpenChannelManageSession(_session);
    this._linkSession = new TalkOpenLinkSession(_session);

    this._handler = new TalkChannelListHandler(this, infoUpdater);
    this._openHandler = new TalkOpenChannelListHandler(this, infoUpdater);
    this._linkHandler = new TalkOpenLinkHandler(this, infoUpdater);

    this._clientMap = new Map();
    if (clientLinkList.length > 0) {
      clientLinkList.forEach((link) => this._clientMap.set(link.openLink.linkId.toString(), link));
    }

    this._map = new Map();
    if (list.length > 0) {
      list.forEach((channel) => this._map.set(channel.channelId.toString(), channel));
    }
  }

  get(channelId: Long): TalkOpenChannel | undefined {
    return this._map.get(channelId.toString());
  }

  /**
   * Find open channel using linkId
   *
   * @param {Long} linkId
   * @return {TalkOpenChannel | undefined}
   */
  getChannelByLinkId(linkId: Long): TalkOpenChannel | undefined {
    for (const channel of this.all()) {
      if (channel.linkId.eq(linkId)) return channel;
    }
  }

  get size(): number {
    return this._map.size;
  }

  all(): IterableIterator<TalkOpenChannel> {
    return this._map.values();
  }

  allClientLink(): IterableIterator<InformedOpenLink> {
    return this._clientMap.values();
  }

  getClientLink(linkId: Long): InformedOpenLink | undefined {
    return this._clientMap.get(linkId.toString());
  }

  get clientLinkCount(): number {
    return this._clientMap.size;
  }

  private async addChannel(channel: Channel): AsyncCommandResult<TalkOpenChannel> {
    return this.addOpenChannel({ ...channel, linkId: Long.ZERO });
  }

  private async addOpenChannel(channel: OpenChannel): AsyncCommandResult<TalkOpenChannel> {
    const last = this.get(channel.channelId);
    if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

    const talkChannel = new TalkOpenChannel(channel, this._session);

    const res = await talkChannel.updateAll();
    if (!res.success) return res;

    this._map.set(channel.channelId.toString(), talkChannel);

    return { success: true, status: res.status, result: talkChannel };
  }

  private deleteChannel(channelId: Long) {
    const strId = channelId.toString();

    return this._map.delete(strId);
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

  async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
    const res = await this._linkSession.getLatestLinkList();

    if (res.success) {
      const clientMap = new Map();

      res.result.forEach((link) => clientMap.set(link.openLink.linkId.toString(), link));

      this._clientMap = clientMap;
    }

    return res;
  }

  getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]> {
    return this._linkSession.getOpenLink(...components);
  }

  getJoinInfo(linkURL: string, referer?: string): AsyncCommandResult<Readonly<InformedOpenLink>> {
    return this._linkSession.getJoinInfo(linkURL, referer);
  }

  getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._linkSession.getKickList(link);
  }

  removeKicked(link: OpenLinkComponent, kickedUser: OpenLinkKickedUser): AsyncCommandResult {
    return this._linkSession.removeKicked(link, kickedUser);
  }

  async deleteLink(link: OpenLinkComponent): AsyncCommandResult {
    const res = await this._linkSession.deleteLink(link);

    if (res.success) {
      this._clientMap.delete(link.linkId.toString());
      const channel = this.getChannelByLinkId(link.linkId);
      if (channel) {
        this.deleteChannel(channel.channelId);
      }
    }

    return res;
  }

  react(link: OpenLinkComponent, flag: boolean): Promise<{ status: number, success: boolean }> {
    return this._linkSession.react(link, flag);
  }

  getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
    return this._linkSession.getReaction(link);
  }

  async createOpenChannel(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<TalkOpenChannel> {
    const res = await this._linkSession.createOpenChannel(template, profile);
    if (!res.success) return res;

    return this.addOpenChannel(res.result);
  }

  async createOpenDirectProfile(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<InformedOpenLink> {
    const res = await this._linkSession.createOpenDirectProfile(template, profile);

    if (res.success) {
      const link = res.result;
      this._clientMap.set(link.openLink.linkId.toString(), link);
    }

    return res;
  }

  async createOpenProfile(
    template: OpenLinkProfileTemplate & OpenLinkCreateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    const res = await this._linkSession.createOpenProfile(template);
    
    if (res.success) {
      const link = res.result;
      this._clientMap.set(link.openLink.linkId.toString(), link);
    }

    return res;
  }

  async updateOpenLink(
    link: OpenLinkComponent,
    settings: (OpenLinkChannelTemplate | OpenLinkProfileTemplate) & OpenLinkUpdateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    const res = await this._linkSession.updateOpenLink(link, settings);
    
    if (res.success) {
      const link = res.result;
      const clientProfile = this.getClientLink(link.openLink.linkId);
      if (clientProfile) {
        this._clientMap.set(link.openLink.linkId.toString(), link)
      }
    }

    return res;
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelListEvents>): void {
    const ctx = new EventContext<OpenChannelListEvents>(this, parentCtx);

    for (const channel of this._map.values()) {
      channel.pushReceived(method, data, ctx);
    }

    this._handler.pushReceived(method, data, parentCtx);
    this._openHandler.pushReceived(method, data, parentCtx);
    this._linkHandler.pushReceived(method, data, parentCtx);
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
   * @param {OpenChannel[]} channelList
   */
  static async initialize(
    talkChannelList: TalkOpenChannelList,
    channelList: OpenChannel[] = [],
  ): Promise<TalkOpenChannelList> {
    talkChannelList._map.clear();
    talkChannelList._clientMap.clear();

    await Promise.all(channelList.map((channel) => talkChannelList.addOpenChannel(channel)));
    await talkChannelList.getLatestLinkList();

    return talkChannelList;
  }
}
