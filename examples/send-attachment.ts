/*
 * Created on Wed Feb 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example sends audio on "!example" command
 * and sends contact on "!contact" command.
 */

import { readFileSync } from 'fs';
import { Long } from 'bson';
import { AttachmentApi, AudioAttachment, ChatBuilder, ContactAttachment, KnownChatType, TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const ACCESS_TOKEN = process.env['accessToken'] as string;
const REFRESH_TOKEN = process.env['refreshToken'] as string;
const USER_ID = Long.fromValue(process.env['userId'] as string);

const CLIENT = new TalkClient();

CLIENT.on('chat', async (data, channel) => {
  const sender = data.getSenderInfo(channel);
  if (!sender) return;

  if (data.text === '!example') {
    const attachRes = await AttachmentApi.upload(KnownChatType.AUDIO, 'sample.ogg', readFileSync('sample.ogg'));
    if (!attachRes.success) {
      channel.sendChat('attachment 업로드가 실패 했습니다');
      return;
    }

    const audioAttach: AudioAttachment = {
      d: 10 * 1000
    };

    channel.sendChat(
      new ChatBuilder()
      .attachment(attachRes.result)
      .attachment(audioAttach)
      .build(KnownChatType.AUDIO)
    );
  } else if (data.text === '!contact') {
    const attachRes = await AttachmentApi.upload(
      KnownChatType.CONTACT,
      'sample.vcf',
      // Empty vcard contact
      new TextEncoder().encode('BEGIN:VCARD\nEND:VCARD')
    );

    if (!attachRes.success) {
      channel.sendChat('attachment 업로드가 실패 했습니다');
      return;
    }

    const contactAttach: ContactAttachment = {
      name: 'Hello world',

      // Autofilled by server
      url: ''
    };

    channel.sendChat(
      new ChatBuilder()
      .attachment(attachRes.result)
      .attachment(contactAttach)
      .build(KnownChatType.CONTACT)
    );
  }
});

async function main() {
  const res = await CLIENT.login({
    userId: USER_ID,
    deviceUUID: DEVICE_UUID,
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN,
  });
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}
main().then();