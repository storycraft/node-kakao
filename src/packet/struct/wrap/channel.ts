/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelInfo, ChannelMetaMap, NormalChannelInfo } from '../../../channel/channel-info';
import { OpenChannelInfo } from '../../../openlink/open-channel-info';
import { ChannelInfoStruct, NormalChannelInfoExtra, OpenChannelInfoExtra } from '../channel';
import { structToChatlog } from './chat';

export function structToChannelInfo(struct: ChannelInfoStruct): ChannelInfo {
  const displayUserList = struct.displayMembers.map(
      (userStruct) => {
        return {
          userId: userStruct.userId,
          nickname: userStruct.nickName,
          countryIso: userStruct.countryIso || '',
          profileURL: userStruct.profileImageUrl,
        };
      },
  );

  const metaMap: ChannelMetaMap = {};

  struct.chatMetas.forEach((meta) => metaMap[meta.type] = { ...meta });

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
  const info: NormalChannelInfo = {
    ...structToChannelInfo(struct),
    joinTime: struct.joinedAtForNewMem,
  };

  return info;
}

export function structToOpenChannelInfo(struct: ChannelInfoStruct & OpenChannelInfoExtra): OpenChannelInfo {
  const info: OpenChannelInfo = {
    ...structToChannelInfo(struct),
    linkId: struct.li,
    openToken: struct.otk,
    o: struct.o,
    directChannel: struct.directChat,
  };

  return info;
}
