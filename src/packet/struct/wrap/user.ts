/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkChannelUserInfo, OpenLinkKickedUserInfo } from '../../../openlink';
import { NormalChannelUserInfo, OpenChannelUserInfo } from '../../../user';
import { UserType } from '../../../user';
import { NormalMemberStruct, OpenLinkChannelUserStruct, OpenLinkKickedMemberStruct, OpenMemberStruct } from '../user';

export function structToChannelUserInfo(struct: NormalMemberStruct): NormalChannelUserInfo {
  return {
    userId: struct.userId,
    userType: struct.type,
    nickname: struct.nickName,
    countryIso: struct.countryIso,
    statusMessage: struct.statusMessage,
    suspended: struct.suspended,
    linkedServices: struct.linkedServices,
    profileURL: struct.profileImageUrl,
    fullProfileURL: struct.fullProfileImageUrl,
    originalProfileURL: struct.originalProfileImageUrl,
    ut: struct.ut,
    accountId: struct.accountId,
  };
}

export function structToOpenChannelUserInfo(struct: OpenMemberStruct): OpenChannelUserInfo {
  return {
    userId: struct.userId,
    linkId: struct.pli,
    openToken: struct.opt,
    perm: struct.mt,
    userType: struct.type,
    nickname: struct.nickName,
    profileURL: struct.pi,
    fullProfileURL: struct.fpi,
    originalProfileURL: struct.opi,
  };
}

export function structToOpenLinkChannelUserInfo(struct: OpenLinkChannelUserStruct): OpenLinkChannelUserInfo {
  return {
    userId: struct.userId,
    linkId: struct.pli,
    openToken: struct.opt,
    perm: struct.lmt,
    userType: UserType.OPEN_PROFILE,
    nickname: struct.nn,
    profileURL: struct.pi,
    fullProfileURL: struct.fpi,
    originalProfileURL: struct.opi,
    privilege: struct.pv,
    profileType: struct.ptp,
  };
}

export function structToOpenLinkKickedUserInfo(struct: OpenLinkKickedMemberStruct): OpenLinkKickedUserInfo {
  return {
    nickname: struct.nickName,
    userId: struct.userId,
    profileURL: struct.pi,
    kickedChannelId: struct.c,
  };
}
