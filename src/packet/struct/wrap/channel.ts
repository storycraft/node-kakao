/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelInfo, ChannelMetaMap, NormalChannelInfo } from '../../../channel';
import { OpenChannelInfo } from '../../../openlink';
import { DisplayUserInfo } from '../../../user/channel-user-info';
import { ChannelDataStruct, ChannelInfoStruct, NormalChannelInfoExtra, OpenChannelInfoExtra } from '../channel';
import { structToChatlog } from './chat';

export function structToChannelInfo(struct: ChannelInfoStruct): ChannelInfo {
  const displayUserList = struct.displayMembers ? struct.displayMembers.map(
    (userStruct) => {
      return {
        userId: userStruct.userId,
        nickname: userStruct.nickName,
        countryIso: userStruct.countryIso || '',
        profileURL: userStruct.profileImageUrl,
      };
    },
  ) : [];

  const metaMap: ChannelMetaMap = {};

  struct.chatMetas?.forEach((meta) => metaMap[meta.type] = { ...meta });

  const info: ChannelInfo = {
    channelId: struct.chatId,
    type: struct.type,
    activeUserCount: struct.activeMembersCount,
    newChatCount: struct.newMessageCount,
    newChatCountInvalid: struct.invalidNewMessageCount,
    lastChatLogId: struct.lastLogId,
    pushAlert: struct.pushAlert,
    lastSeenLogId: struct.lastSeenLogId,
    metaMap,
    displayUserList,
  };

  if (struct.lastChatLog) {
    info['lastChatLog'] = structToChatlog(struct.lastChatLog);
  }

  return info;
}

export function structToNormalChannelInfo(struct: ChannelInfoStruct & NormalChannelInfoExtra): NormalChannelInfo {
  return {
    ...structToChannelInfo(struct),
    joinTime: struct.joinedAtForNewMem,
  };
}

export function structToOpenChannelInfo(struct: ChannelInfoStruct & OpenChannelInfoExtra): OpenChannelInfo {
  return {
    ...structToChannelInfo(struct),
    linkId: struct.li,
    openToken: struct.otk,
    directChannel: struct.directChat,
  };
}

export function dataStructToChannelInfo(channelData: ChannelDataStruct): ChannelInfo {
  const commonInfo: Partial<ChannelInfo> = {
    channelId: channelData.c,
    type: channelData.t,
    lastChatLogId: channelData.ll,
    activeUserCount: channelData.a,
    lastSeenLogId: channelData.s,
    newChatCount: channelData.n,
    pushAlert: channelData.p
  };

  if (channelData.l) {
    commonInfo['lastChatLog'] = structToChatlog(channelData.l);
  }

  if (channelData.i && channelData.k) {
    commonInfo['displayUserList']
    const list: DisplayUserInfo[] = [];
    const len = channelData.i.length;
    for (let i = 0; i < len; i++) {
      list.push({ userId: channelData.i[i], nickname: channelData.k[i], profileURL: '' });
    }
  }
  return ChannelInfo.createPartial(commonInfo);
}


export function dataStructToNormalChannelInfo(channelData: ChannelDataStruct): NormalChannelInfo {
  return NormalChannelInfo.createPartial(dataStructToChannelInfo(channelData));
}


export function dataStructToOpenChannelInfo(channelData: ChannelDataStruct): OpenChannelInfo {
  return OpenChannelInfo.createPartial({
    ...dataStructToChannelInfo(channelData),
    linkId: channelData.li,
    openToken: channelData.otk
  });
}