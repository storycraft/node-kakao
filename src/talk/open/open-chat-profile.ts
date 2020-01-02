import { OpenLinkStruct, OpenMemberStruct } from "../struct/open-link-struct";
import { Long } from "bson";
import { UserInfoBase } from "../user/chat-user";

/*
 * Created on Thu Jan 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class OpenChatProfile {

    constructor(
        private linkId: Long,
        private openToken: number = 0,
        private linkName: string = '',
        private linkURL: string = '',
        private memberInfo: OpenUserInfo
    ) {

    }

    get LinkId() {
        return this.linkId;
    }

    get OpenToken() {
        return this.openToken;
    }

    get LinkName() {
        return this.linkName;
    }

    get LinkURL() {
        return this.linkURL;
    }

    get OpenUserInfo() {
        return this.memberInfo;
    }

    static fromStruct(openLinkStruct: OpenLinkStruct): OpenChatProfile {
        return new OpenChatProfile(openLinkStruct.LinkId, openLinkStruct.OpenToken, openLinkStruct.LinkName, openLinkStruct.LinkURL, OpenUserInfo.fromStruct(openLinkStruct.Member));
    }

}

export class OpenUserInfo implements UserInfoBase {
    
    constructor(
        private nickname: string,
        private profileImageURL: string,
        private fullProfileImageURL: string,
        private originalProfileImageURL: string,
        private lastInfoCache: number
    ) {
        
    }

    get Nickname() {
        return this.nickname;
    }

    get ProfileImageURL() {
        return this.profileImageURL;
    }

    get FullProfileImageURL() {
        return this.fullProfileImageURL;
    }

    get OriginalProfileImageURL() {
        return this.originalProfileImageURL;
    }

    get LastInfoCache() {
        return this.lastInfoCache;
    }

    updateNickname(nickname: string) {
        this.nickname = nickname;
    }

    static fromStruct(memberStruct: OpenMemberStruct): OpenUserInfo {
        return new OpenUserInfo(memberStruct.NickName, memberStruct.ProfileImageUrl, memberStruct.FullProfileImageUrl, memberStruct.OriginalProfileImageUrl, Date.now())
    }


}