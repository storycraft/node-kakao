/*
 * Created on Mon Feb 08 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelInfoStruct, InformedOpenLinkStruct } from '../struct';

export interface CreateOpenLinkRes {

  ol: InformedOpenLinkStruct;

  chatRoom?: ChannelInfoStruct;

}
