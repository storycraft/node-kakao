/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example sends a photo when user types the "!example" command
 */

import { readFileSync } from 'fs';
import { AuthApiClient, KnownChatType, TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const DEVICE_NAME = process.env['deviceName'] as string;

const EMAIL = process.env['accountEmail'] as string;
const PASSWORD = process.env['accountPwd'] as string;

const CLIENT = new TalkClient();

CLIENT.on('chat', (data, channel) => {
  const sender = data.getSenderInfo(channel);
  if (!sender) return;

  if (data.text === '!example') {
    channel.sendMedia(KnownChatType.PHOTO, {
      name: 'nyancat.png',
      data: readFileSync('nyancat.png'),
      width: 100,
      height: 100,
      ext: 'png'
    });
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