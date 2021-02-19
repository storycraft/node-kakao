/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chatlog } from '../../../chat';
import { JsonUtil } from '../../../util';
import { ChatlogStruct } from '../chat';

export function structToChatlog(struct: ChatlogStruct): Chatlog {
  const chat: Chatlog = {
    type: struct.type,
    logId: struct.logId,
    prevLogId: struct.prevId,
    sender: { userId: struct.authorId },
    sendAt: struct.sendAt * 1000,
    messageId: struct.msgId,
  };

  if (struct.message) {
    chat['text'] = struct.message;
  }

  if (struct.attachment) {
    chat['attachment'] = JsonUtil.parseLoseless(struct.attachment);
  }

  if (struct.supplement) {
    chat['supplement'] = JsonUtil.parseLoseless(struct.supplement);
  }

  return chat;
}
