/*
 * Created on Wed Feb 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example contains listening various type of events.
 */

import { TalkClient } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const ACCESS_TOKEN = process.env['accessToken'] as string;
const REFRESH_TOKEN = process.env['refreshToken'] as string;

const CLIENT = new TalkClient();

CLIENT.on('error', (err) => {
  console.log(`Client error!! err: ${err}`);
});

CLIENT.on('switch_server', () => {
  console.log('Server switching requested.');
});

CLIENT.on('disconnected', (reason) => {
  console.log(`Disconnected!! reason: ${reason}`);
});

CLIENT.on('chat_deleted', (feedChatlog, channel, feed) => {
  console.log(`${feed.logId} deleted by ${feedChatlog.sender.userId}`);
});

CLIENT.on('link_created', link => {
  console.log(`Link created: ${link.openLink.linkId} url: ${link.openLink.linkURL}`);
});

CLIENT.on('link_deleted', link => {
  console.log(`Link deleted: ${link.openLink.linkId} url: ${link.openLink.linkURL}`);
});

CLIENT.on('user_join', (joinLog, channel, user, feed) => {
  console.log(`User ${user.nickname} (${user.userId}) joined channel ${channel.channelId}`);
});

CLIENT.on('user_left', (leftLog, channel, user, feed) => {
  console.log(`User ${user.nickname} (${user.userId}) left channel ${channel.channelId}`);
});

CLIENT.on('profile_changed', (channel, lastInfo, user) => {
  console.log(`Profile of ${user.userId} changed. From name: ${lastInfo.nickname} profile: ${lastInfo.profileURL}`);
});

CLIENT.on('perm_changed', (channel, lastInfo, user) => {
  console.log(`Perm of ${user.userId} changed. From ${lastInfo.perm} to ${user.perm}`);
});

CLIENT.on('channel_join', channel => {
  console.log(`Joining channel ${channel.getDisplayName()}`);
});

CLIENT.on('channel_left', channel => {
  console.log(`Leaving channel ${channel.getDisplayName()}`);
});

CLIENT.on('message_hidden', (hideLog, channel, feed) => {
  console.log(`Message ${hideLog.logId} hid from ${channel.channelId} by ${hideLog.sender.userId}`);
});

CLIENT.on('channel_link_deleted', (feedLog, channel, feed) => {
  console.log(`Open channel (${channel.channelId}) link has been deleted`);
});

CLIENT.on('host_handover', (channel, lastLink, link) => {
  const lastOwnerNick = lastLink.linkOwner.nickname;
  const newOwnerNick = link.linkOwner.nickname;

  console.log(`OpenLink host handover on channel ${channel.channelId} from ${lastOwnerNick} to ${newOwnerNick}`);
});

CLIENT.on('channel_kicked', (kickedLog, channel, feed) => {
  console.log(`Kicked from channel ${channel.channelId}`);
});

CLIENT.on('meta_change', (channel, type, newMeta) => {
  console.log(`Meta changed from ${channel.channelId} type: ${type} meta: ${newMeta.content} by ${newMeta.authorId}`);
});

CLIENT.on('chat_event', (channel, author, type, count, chat) => {
  channel.sendChat(`${author.nickname} touched hearts ${count} times`);
});

async function main() {
  const res = await CLIENT.login({
    deviceUUID: DEVICE_UUID,
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN
  });
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}
main().then();