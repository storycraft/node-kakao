/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkChannelUserInfo } from "../../../openlink/open-link-user-info";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../../user/channel-user-info";
import { UserType } from "../../../user/user-type";
import { NormalMemberStruct, OpenLinkChannelUserStruct, OpenMemberStruct } from "../user";

export function structToChannelUserInfo(struct: NormalMemberStruct): ChannelUserInfo {
    return {
        userId: struct.userId,
        userType: struct.type,
        nickname: struct.nickName,
        countryIso: struct.countryIso,
        statusMessage: struct.statusMessage,
        suspended: struct.suspended,
        linkedServies: struct.linkedServices,
        profileURL: struct.profileImageUrl,
        fullProfileURL: struct.fullProfileImageUrl,
        originalProfileURL: struct.originalProfileImageUrl,
        ut: struct.ut,
        accountId: struct.accountId
    }
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
    }
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
        profileType: struct.ptp
    }
}