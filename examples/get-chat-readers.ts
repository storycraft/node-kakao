/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example sends reader list of replied chat when user types command "!readers"
 */

import { Long } from 'bson';
import { KnownChatType, ReplyAttachment, TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const ACCESS_TOKEN = process.env['accessToken'] as string;
const REFRESH_TOKEN = process.env['refreshToken'] as string;
const USER_ID = Long.fromValue(process.env['userId'] as string);

const CLIENT = new TalkClient();

CLIENT.on('chat', (data, channel) => {
  const sender = data.getSenderInfo(channel);
  if (!sender) return;

  if (data.originalType === KnownChatType.REPLY && data.text === '!readers') {
    const reply = data.attachment<ReplyAttachment>();
    const logId = reply.src_logId;
    if (logId) {
      const readers = channel.getReaders({ logId });
      channel.sendChat(`${logId} Readers (${readers.length})\n${readers.map(reader => reader.nickname).join(', ')}`);
    }
  }
});

async function main() {
  const res = await CLIENT.login({
    userId: USER_ID,
    deviceUUID: DEVICE_UUID,
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN
  });
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}
main().then();
