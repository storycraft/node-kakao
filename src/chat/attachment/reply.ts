/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Attachment } from '.';
import { ChatType } from '../chat-type';
import { MentionStruct } from './mention';

export interface ReplyAttachment extends Attachment {

  // eslint-disable-next-line camelcase
  attach_only: boolean;
  // eslint-disable-next-line camelcase
  attach_type: number;

  // eslint-disable-next-line camelcase
  src_linkId?: Long;
  // eslint-disable-next-line camelcase
  src_logId: Long;

  // eslint-disable-next-line camelcase
  src_mentions: MentionStruct[];
  // eslint-disable-next-line camelcase
  src_message: string;
  // eslint-disable-next-line camelcase
  src_type: ChatType;

  // eslint-disable-next-line camelcase
  src_userId: Long;

}
