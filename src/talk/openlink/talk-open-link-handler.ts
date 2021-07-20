/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { EventContext, TypedEmitter } from '../../event';
import { OpenLinkService, InformedOpenLink } from '../../openlink';
import { InformedOpenLinkStruct, structToOpenLink, structToOpenLinkInfo } from '../../packet/struct';
import { DefaultRes } from '../../request';
import { OpenLinkEvent } from '../event';
import { Managed } from '../managed';

export interface OpenLinkUpdater {

  addClientLink(link: InformedOpenLink): void;
  deleteClientLink(linkId: Long): boolean;

}

export class TalkOpenLinkHandler implements Managed<OpenLinkEvent> {
  constructor(
    private _service: OpenLinkService,
    private _emitter: TypedEmitter<OpenLinkEvent>,
    private _updater: OpenLinkUpdater,
  ) {

  }

  private _callEvent<U extends keyof OpenLinkEvent>(
    parentCtx: EventContext<OpenLinkEvent>,
    event: U,
    ...args: Parameters<OpenLinkEvent[U]>
  ) {
    this._emitter.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  async pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenLinkEvent>): Promise<void> {
    switch (method) {
      case 'SYNCLINKCR': {
        const linkStruct = data['ol'] as InformedOpenLinkStruct;

        const informed: InformedOpenLink = {
          openLink: structToOpenLink(linkStruct),
          info: structToOpenLinkInfo(linkStruct),
        };

        this._updater.addClientLink(informed);

        this._callEvent(parentCtx, 'link_created', informed);
        break;
      }

      case 'SYNCLINKDL': {
        const linkId = data['li'] as Long;
        const clientLink = this._service.getClientLink(linkId);

        if (!clientLink) return;

        this._updater.deleteClientLink(linkId);
        this._callEvent(parentCtx, 'link_deleted', clientLink);

        break;
      }

      default: break;
    }
  }
}
