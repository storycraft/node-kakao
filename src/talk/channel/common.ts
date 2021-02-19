/*
 * Created on Wed Feb 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Chatlog, ChatType } from '../../chat';
import { MediaKeyComponent } from '../../media';
import { OpenChannelSession } from '../../openlink';
import { AsyncCommandResult, CommandResultDone, KnownDataStatusCode } from '../../request';
import { NormalChannelUserInfo, OpenChannelUserInfo } from '../../user';
import { MediaUploadTemplate } from '../media/upload';
import { TalkChannelSession } from './talk-channel-session';

/*
 * Common complex channel methods
 */

export async function sendMultiMedia(
    channelSession: TalkChannelSession,
    type: ChatType,
    templates: MediaUploadTemplate[],
): AsyncCommandResult<Chatlog> {
  const res = await channelSession.uploadMultiMedia(type, templates);
  if (!res.success) return res;

  const keyResList = await Promise.all(res.result.map((uploader) => uploader.upload()));
  const failed = keyResList.find((uploadRes) => !uploadRes.success);
  if (failed && !failed.success) return failed;
  const keyList = keyResList as CommandResultDone<MediaKeyComponent>[];

  return channelSession.forwardChat({
    text: '',
    type,
    attachment: {
      kl: keyList.map((uploadRes) => uploadRes.result.key),
      wl: templates.map((template) => template.width || 0),
      hl: templates.map((template) => template.height || 0),
      mtl: templates.map((template) => template.ext || ''),
      sl: templates.map((template) => template.data.byteLength),
      imageUrls: [], thumbnailUrls: [],
      thumbnailWidths: [], thumbnailHeights: [],
    },
  });
}

export function initWatermarkMap(
  idList: Long[],
  watermarkList: Long[]
): Map<string, Long> {
  const watermarkMap: Map<string, Long> = new Map();
  const userLen = idList.length;
  for (let i = 0; i < userLen; i++) {
    const userId = idList[i];
    const watermark = watermarkList[i];

    watermarkMap.set(userId.toString(), watermark);
  }
  
  return watermarkMap;
}

export async function initNormalUserList(
  session: TalkChannelSession,
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