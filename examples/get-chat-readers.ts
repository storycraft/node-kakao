/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example sends reader list of replied chat when user types command "!readers"
 */

import { AuthApiClient, KnownChatType, ReplyAttachment, TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const DEVICE_NAME = process.env['deviceName'] as string;

const EMAIL = process.env['accountEmail'] as string;
const PASSWORD = process.env['accountPwd'] as string;

const CLIENT = new TalkClient();

CLIENT.on('chat', (data, channel) => {
  const sender = data.getSenderInfo(channel);
  if (!sender) return;

  if (data.originalType === KnownChatType.REPLY && data.text === '*readers') {
    const reply = data.attachment<ReplyAttachment>();
    const logId = reply.src_logId;
    if (logId) {
      const readers = channel.getReaders({ logId });
      channel.sendChat(`${logId} Readers (${readers.length})\n${readers.map(reader => reader.nickname).join(', ')}`);
    }
  }
});

async function main() {
  const api = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
  const loginRes = await api.login({
    email: EMAIL,
    password: PASSWORD,
    forced: true,
  });
  if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

  const res = await CLIENT.login(loginRes.result);
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}
main().then();