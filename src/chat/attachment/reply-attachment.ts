/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatType } from '../chat-type';

export interface ReplyAttachment {

    attach_only: boolean;
    attach_type: number;

    // mentions: any[];

    src_linkId?: Long;
    src_logId: Long;

    // src_mentions: any[];
    src_message: string;
    src_type: ChatType;

    src_userId: Long;

}
