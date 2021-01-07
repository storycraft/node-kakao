/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatUserInfo, ChatUser, OpenChatUserInfo } from "../user/chat-user";
import { UserManager } from "../user/user-manager";
import { MemberStruct } from "../struct/member-struct";
import { OpenLinkProfile } from "../open/open-link";
import { OpenMemberStruct } from "../struct/open/open-link-struct";
import { EventEmitter } from "events";
import { Long } from "bson";
import { OpenMemberType, OpenProfileType } from "../open/open-link-type";
import { ChatChannel } from "../channel/chat-channel";
import { RequestResult } from "../request/request-result";


export class ManagedChatUser extends EventEmitter implements ChatUser {

    constructor(private manager: UserManager, private id: Long) {
        super();
    }

    get Client() {
        return this.manager.Client;
    }

    get Id() {
        return this.id;
    }

    isClientUser() {
        return false;
    }

    createDM(): Promise<RequestResult<ChatChannel>> {
        return this.Client.ChannelManager.createChannel([ this ]);
    }

}

export class ManagedChatUserInfo implements ChatUserInfo {

    constructor(private manager: UserManager, private user: ChatUser, private memberStruct: MemberStruct) {
        
    }

    get Client() {
        return this.manager.Client;
    }

    get User() {
        return this.user;
    }

    get Id() {
        return this.user.Id;
    }

    get Nickname() {
        return this.memberStruct.nickname;
    }

    get AccountId() {
        return this.memberStruct.accountId;
    }

    get ProfileImageURL() {
        return this.memberStruct.profileImageUrl;
    }

    get FullProfileImageURL() {
        return this.memberStruct.fullProfileImageUrl;
    }

    get OriginalProfileImageURL() {
        return this.memberStruct.originalProfileImageUrl;
    }

    get UserType() {
        return this.memberStruct.type;
    }

    isOpenUser() {
        return false;
    }

    updateNickname(nickname: string) {
        if (nickname && this.memberStruct.nickname !== nickname) {
            this.memberStruct.nickname = nickname;
        }
    }

}

export class ManagedOpenChatUserInfo implements OpenChatUserInfo {

    constructor(private manager: UserManager, private user: ChatUser, private memberStruct: OpenMemberStruct) {
        
    }

    get Client() {
        return this.manager.Client;
    }

    get User() {
        return this.user;
    }

    get Id() {
        return this.user.Id;
    }

    get Nickname() {
        return this.memberStruct.nickname;
    }

    get ProfileLinkId() {
        return this.memberStruct.linkId || null;
    }

    get ProfileOpenToken() {
        return this.memberStruct.openToken || -1;
    }
    
    get MemberType() {
        return this.memberStruct.memberType || OpenMemberType.NONE;
    }

    get UserType() {
        return this.memberStruct.type;
    }

    get ProfileImageURL() {
        return this.memberStruct.profileImageUrl;
    }

    get FullProfileImageURL() {
        return this.memberStruct.fullProfileImageUrl;
    }

    get OriginalProfileImageURL() {
        return this.memberStruct.originalProfileImageUrl;
    }

    hasOpenProfile() {
        return !!this.memberStruct.linkId;
    }

    async getOpenLink() {
        if (!this.memberStruct.linkId) return null;

        return (await this.manager.Client.OpenLinkManager.get(this.memberStruct.linkId)) as OpenLinkProfile;
    }

    isOpenUser() {
        return true;
    }

    updateNickname(nickname: string) {
        if (this.memberStruct.nickname !== nickname) {
            this.memberStruct.nickname = nickname;
        }
    }

    updateMemberType(memberType: OpenMemberType) {
        this.memberStruct.memberType = memberType;
    }

}
