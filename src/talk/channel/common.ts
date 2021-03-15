/*
 * Created on Wed Feb 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { sha1 } from 'hash-wasm';
import { TalkChannel } from '.';
import { ChannelDataUpdater, ChannelSession, NormalChannelSession, UpdatableChannelDataStore } from '../../channel';
import { Chatlog, ChatLogged, ChatType } from '../../chat';
import { MediaUploadForm } from '../../media';
import { OpenChannelSession } from '../../openlink';
import { AsyncCommandResult, KnownDataStatusCode } from '../../request';
import { ChannelUser, NormalChannelUserInfo, OpenChannelUserInfo } from '../../user';
import { MediaUploadTemplate } from '../media/upload';

/*
 * Common complex channel methods
 */

export async function mediaTemplateToForm(template: MediaUploadTemplate): Promise<MediaUploadForm> {
  return {
    size: template.data.byteLength,
    checksum: await sha1(template.data),
    metadata: {
      name: template.name,
      width: template.width,
      height: template.height,
      ext: template.ext
    }
  };
}

export async function sendMultiMedia(
  channelSession: ChannelSession,
  type: ChatType,
  templates: MediaUploadTemplate[],
): AsyncCommandResult<Chatlog> {
  const res = await channelSession.uploadMultiMedia(
    type,
    await Promise.all(templates.map(mediaTemplateToForm))
  );
  if (!res.success) return res;

  let i = 0;
  for await (const entryRes of res.result.entries) {
    if (!entryRes.success) return entryRes;
    const entry = entryRes.result;
    const data = templates[i].data;

    await entry.stream.write(data.subarray(Math.min(entry.offset, data.byteLength)));

    const finishRes = await entry.finish();
    if (!finishRes.success) return finishRes;

    i++;
  }

  return res.result.finish();
}

export async function sendMedia(
  channelSession: ChannelSession,
  type: ChatType,
  template: MediaUploadTemplate
): AsyncCommandResult<Chatlog> {
  const res = await channelSession.uploadMedia(type, await mediaTemplateToForm(template));
  if (!res.success) return res;

  const data = template.data;

  await res.result.stream.write(data.subarray(Math.min(res.result.offset, data.byteLength)));

  return res.result.finish();
}

export function initWatermark(
  updater: ChannelDataUpdater<unknown, unknown>,
  idList: Long[],
  watermarkList: Long[]
): void {
  updater.clearWatermark();

  const userLen = idList.length;
  for (let i = 0; i < userLen; i++) {
    const userId = idList[i];
    const watermark = watermarkList[i];

    updater.updateWatermark(userId, watermark);
  }
}

export async function initNormalUserList(
  session: NormalChannelSession,
  userIdList: Long[]
): AsyncCommandResult<NormalChannelUserInfo[]> {
  const userList = userIdList.map(userId => {
    return { userId };
  });

  const infoList: NormalChannelUserInfo[] = [];

  const len = userList.length;
  for (let i = 0; i < len; i += 300) {
    const userRes = await session.getLatestUserInfo(...userList.slice(i, i + 300));
    if (!userRes.success) return userRes;

    infoList.push(...userRes.result);
  }

  return {
    success: true,
    status: KnownDataStatusCode.SUCCESS,
    result: infoList
  };
}

export async function initOpenUserList(
  session: OpenChannelSession,
  userIdList: Long[]
): AsyncCommandResult<OpenChannelUserInfo[]> {
  const userList = userIdList.map(userId => {
    return { userId };
  });

  const infoList: OpenChannelUserInfo[] = [];

  const len = userList.length;
  for (let i = 0; i < len; i += 300) {
    const userRes = await session.getLatestUserInfo(...userList.slice(i, i + 300));
    if (!userRes.success) return userRes;

    infoList.push(...userRes.result);
  }

  return {
    success: true,
    status: KnownDataStatusCode.SUCCESS,
    result: infoList
  };
}

export async function updateChatList(
  channel: TalkChannel
): Promise<void> {
  const startChat = await channel.chatListStore.last();
  const lastChatlog = channel.info.lastChatLog;

  if (lastChatlog && (!startChat || startChat.logId.lessThan(lastChatlog.logId))) {
    const iter = channel.syncChatList(lastChatlog.logId, startChat?.logId || Long.ZERO);
    for (let next = await iter.next(); !next.done; next = await iter.next());
  }
}

/**
 * Store channel data in memory
 */
export class TalkMemoryChannelDataStore<T, U>
  implements UpdatableChannelDataStore<T, U> {

  constructor(
    private _info: T,
    private _userInfoMap: Map<string, U> = new Map(),
    private _watermarkMap: Map<string, Long> = new Map()
  ) {

  }

  get info(): Readonly<T> {
    return this._info;
  }

  get userCount(): number {
    return this._userInfoMap.size;
  }

  getUserInfo(user: ChannelUser): Readonly<U> | undefined {
    return this._userInfoMap.get(user.userId.toString());
  }

  getAllUserInfo(): IterableIterator<U> {
    return this._userInfoMap.values();
  }

  clearUserList(): void {
    this._userInfoMap.clear();
  }

  getReadCount(chat: ChatLogged): number {
    let count = 0;

    if (this.userCount >= 100) return 0;

    for (const [strId] of this._userInfoMap) {
      const watermark = this._watermarkMap.get(strId);

      if (!watermark || watermark && watermark.greaterThanOrEqual(chat.logId)) count++;
    }

    return count;
  }

  getReaders(chat: ChatLogged): Readonly<U>[] {
    const list: U[] = [];

    if (this.userCount >= 100) return [];

    for (const [strId, userInfo] of this._userInfoMap) {
      const watermark = this._watermarkMap.get(strId);

      if (watermark && watermark.greaterThanOrEqual(chat.logId)) list.push(userInfo);
    }

    return list;
  }

  updateInfo(info: Partial<T>): void {
    this._info = { ...this._info, ...info }
  }

  setInfo(info: T): void {
    this._info = info;
  }

  updateUserInfo(user: ChannelUser, info: Partial<U>): void {
    const strId = user.userId.toString();

    const lastInfo = this._userInfoMap.get(strId);

    this._userInfoMap.set(strId, { ...lastInfo, ...info } as U);
  }

  removeUser(user: ChannelUser): boolean {
    const strId = user.userId.toString();

    const userInfoRes = this._userInfoMap.delete(strId);
    const watermarkRes = this._watermarkMap.delete(strId);

    return userInfoRes || watermarkRes;
  }

  updateWatermark(readerId: Long, watermark: Long): void {
    this._watermarkMap.set(readerId.toString(), watermark);
  }

  clearWatermark(): void {
    this._watermarkMap.clear();
  }

}
