/*
 * Created on Sun Mar 21 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Long } from 'bson';
import { EventContext, TypedEmitter } from '../../event';
import {
  InformedOpenLink,
  OpenChannel,
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
  OpenLinkUpdateTemplate
} from '../../openlink';
import { AsyncCommandResult, DefaultRes } from '../../request';
import { TalkSession } from '../client';
import { OpenLinkEvent, OpenLinkListEvents } from '../event';
import { Managed } from '../managed';
import { OpenLinkUpdater, TalkOpenLinkHandler } from './talk-open-link-handler';
import { TalkOpenLinkSession } from './talk-open-link-session';

export class TalkClientLinkStore extends TypedEmitter<OpenLinkListEvents> implements
  OpenLinkSession, OpenLinkService, OpenLinkUpdater,
  Managed<OpenLinkListEvents> {

  private _map: Map<string, InformedOpenLink>;

  private _linkHandler: TalkOpenLinkHandler;
  private _linkSession: TalkOpenLinkSession;

  constructor(
    session: TalkSession,
    clientLinkList: InformedOpenLink[]
  ) {
    super();

    this._linkSession = new TalkOpenLinkSession(session);
    this._linkHandler = new TalkOpenLinkHandler(this, this, this);

    this._map = new Map();
    if (clientLinkList.length > 0) {
      clientLinkList.forEach((link) => this._map.set(link.openLink.linkId.toString(), link));
    }
  }
  
  async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
    const res = await this._linkSession.getLatestLinkList();

    if (res.success) {
      const clientMap = new Map();

      res.result.forEach((link) => clientMap.set(link.openLink.linkId.toString(), link));

      this._map = clientMap;
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
      this.deleteClientLink(link.linkId);
    }

    return res;
  }

  react(link: OpenLinkComponent, flag: boolean): AsyncCommandResult {
    return this._linkSession.react(link, flag);
  }

  getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
    return this._linkSession.getReaction(link);
  }

  async createOpenChannel(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<OpenChannel> {
    return this._linkSession.createOpenChannel(template, profile);
  }

  async createOpenDirectProfile(
    template: OpenLinkChannelTemplate & OpenLinkCreateTemplate,
    profile: OpenLinkProfiles
  ): AsyncCommandResult<InformedOpenLink> {
    const res = await this._linkSession.createOpenDirectProfile(template, profile);

    if (res.success) {
      const link = res.result;
      this._map.set(link.openLink.linkId.toString(), link);
    }

    return res;
  }

  async createOpenProfile(
    template: OpenLinkProfileTemplate & OpenLinkCreateTemplate
  ): AsyncCommandResult<InformedOpenLink> {
    const res = await this._linkSession.createOpenProfile(template);
    
    if (res.success) {
      const link = res.result;
      this._map.set(link.openLink.linkId.toString(), link);
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
        this._map.set(link.openLink.linkId.toString(), link)
      }
    }

    return res;
  }

  addClientLink(link: InformedOpenLink): void {
    this._map.set(link.openLink.linkId.toString(), link);
  }

  deleteClientLink(linkId: Long): boolean {
    return this._map.delete(linkId.toString());
  }

  allClientLink(): IterableIterator<InformedOpenLink> {
    return this._map.values();
  }

  getClientLink(linkId: Long): InformedOpenLink | undefined {
    return this._map.get(linkId.toString());
  }

  get clientLinkCount(): number {
    return this._map.size;
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenLinkEvent>): void {
    this._linkHandler.pushReceived(method, data, parentCtx);
  }
  
}