/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import {
  InformedOpenLink,
  OpenLink,
  OpenLinkComponent,
  OpenLinkKickedUser,
  OpenLinkKickedUserInfo,
  OpenLinkSession,
} from '../../openlink';
import { AsyncCommandResult, CommandResult, DefaultRes } from '../../request';
import { structToOpenLink, structToOpenLinkInfo } from '../../packet/struct';
import { OpenLinkEvent } from '../event';
import { Managed } from '../managed';
import { TalkOpenLinkSession } from './talk-openlink-session';

/**
 * Provide openlink services
 */
export class OpenLinkService extends TypedEmitter<OpenLinkEvent> implements Managed<OpenLinkEvent>, OpenLinkSession {
    private _session: TalkOpenLinkSession;

    private _clientMap: Map<string, InformedOpenLink>;

    constructor(session: TalkSession) {
      super();

      this._session = new TalkOpenLinkSession(session);

      this._clientMap = new Map();
    }

    /**
     * Get all client link as iterator
     *
     * @return {IterableIterator<InformedOpenLink>}
     */
    all(): IterableIterator<InformedOpenLink> {
      return this._clientMap.values();
    }

    /**
     * Try to get client profile using linkId
     *
     * @param {Long} linkId
     * @return {InformedOpenLink | undefined}
     */
    get(linkId: Long): InformedOpenLink | undefined {
      return this._clientMap.get(linkId.toString());
    }

    async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
      const res = await this._session.getLatestLinkList();

      if (res.success) {
        const clientMap = new Map();

        res.result.forEach((link) => clientMap.set(link.openLink.linkId.toString(), link));

        this._clientMap = clientMap;
      }

      return res;
    }

    getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]> {
      return this._session.getOpenLink(...components);
    }

    getJoinInfo(linkURL: string, referer?: string): AsyncCommandResult<Readonly<InformedOpenLink>> {
      return this._session.getJoinInfo(linkURL, referer);
    }

    getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
      return this._session.getKickList(link);
    }

    removeKicked(link: OpenLinkComponent, kickedUser: OpenLinkKickedUser): AsyncCommandResult {
      return this._session.removeKicked(link, kickedUser);
    }

    async deleteLink(link: OpenLinkComponent): Promise<CommandResult> {
      const res = await this._session.deleteLink(link);

      if (res.success) {
        this._clientMap.delete(link.linkId.toString());
      }

      return res;
    }

    react(link: OpenLinkComponent, flag: boolean): Promise<{status: number, success: boolean}> {
      return this._session.react(link, flag);
    }

    getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
      return this._session.getReaction(link);
    }

    /**
     * Initialize OpenLinkService
     *
     * @param {OpenLinkService} service
     */
    static async initialize(service: OpenLinkService): Promise<void> {
      service._clientMap.clear();

      await service.getLatestLinkList();
    }

    private _callEvent<U extends keyof OpenLinkEvent>(
        parentCtx: EventContext<OpenLinkEvent>,
        event: U,
        ...args: Parameters<OpenLinkEvent[U]>
    ) {
      this.emit(event, ...args);
      parentCtx.emit(event, ...args);
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenLinkEvent>): void {
      switch (method) {
        case 'SYNCLINKCR': {
          const linkStruct = data['ol'];

          const informed: InformedOpenLink = {
            openLink: structToOpenLink(linkStruct),
            info: structToOpenLinkInfo(linkStruct),
          };

          this._clientMap.set(informed.openLink.linkId.toString(), informed);

          this._callEvent(parentCtx, 'link_created', informed);
          break;
        }

        case 'SYNCLINKDL': {
          const linkId: Long = data['li'];
          const clientLink = this.get(linkId);

          if (!clientLink) return;

          this._clientMap.delete(linkId.toString());
          this._callEvent(parentCtx, 'link_deleted', clientLink);

          break;
        }

        default: break;
      }
    }
}
