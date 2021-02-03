/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatType } from '../chat-type';

export interface ReplyAttachment {

  // eslint-disable-next-line camelcase
  attach_only: boolean;
  // eslint-disable-next-line camelcase
  attach_type: number;

  // mentions: any[];

  // eslint-disable-next-line camelcase
  src_linkId?: Long;
  // eslint-disable-next-line camelcase
  src_logId: Long;

  // src_mentions: any[];
  // eslint-disable-next-line camelcase
  src_message: string;
  // eslint-disable-next-line camelcase
  src_type: ChatType;

  // eslint-disable-next-line camelcase
  src_userId: Long;

}
