/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * Login using email, password using AuthApiClient.
 * Following this example will make automatic reply at text "안녕하세요" with mention.
 */

import { AuthApiClient, ChatBuilder, KnownChatType, MentionContent, ReplyContent, TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const DEVICE_NAME = process.env['deviceName'] as string;

const EMAIL = process.env['accountEmail'] as string;
const PASSWORD = process.env['accountPwd'] as string;

const CLIENT = new TalkClient();

CLIENT.on('chat', (data, channel) => {
  const sender = data.getSenderInfo(channel);
  if (!sender) return;

  if (data.text === '안녕하세요') {
    // 답장 형식
    // 안녕하세요 @xxx
    channel.sendChat(
      new ChatBuilder()
      .append(new ReplyContent(data.chat))
      .text('안녕하세요 ')
      .append(new MentionContent(sender))
      .build(KnownChatType.REPLY));
    // 일반 텍스트
    // channel.sendChat('안녕하세요');
  }
});

async function main() {
  const api = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
  const loginRes = await api.login({
    email: EMAIL,
    password: PASSWORD,

    // This option force login even other devices are logon
    forced: true,
  });
  if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

  console.log(`Received access token: ${loginRes.result.accessToken}`);

  const res = await CLIENT.login(loginRes.result);
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}
main().then();
