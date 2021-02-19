/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { InformedOpenLink } from '..';
import { TypedEmitter } from '../event/typed';
import { OpenLinkEvent } from '../talk/event';

export interface OpenLinkService extends TypedEmitter<OpenLinkEvent> {

  /**
   * Get all client link as iterator
   *
   * @return {IterableIterator<InformedOpenLink>}
   */
  allClientLink(): IterableIterator<InformedOpenLink>;

  /**
   * Try to get client profile using linkId
   *
   * @param {Long} linkId
   * @return {InformedOpenLink | undefined}
   */
  getClientLink(linkId: Long): InformedOpenLink | undefined;

  readonly clientLinkCount: number;

}
