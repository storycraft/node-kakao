/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { InformedOpenLink } from '..';

export interface OpenLinkService {

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
