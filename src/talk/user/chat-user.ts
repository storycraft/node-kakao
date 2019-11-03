import { LoginAccessDataStruct } from "../struct/login-access-data-struct";
import { Long } from "bson";
import { MemberStruct } from "../struct/member-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatUser {
    
    private userId: Long;
    private userInfo: UserInfo;

    constructor(userId: Long, userInfo: UserInfo = new UserInfo()) {
        this.userId = userId;

        this.userInfo = userInfo;
    }

    get UserId() {
        return this.userId;
    }

    get UserInfo() {
        return this.userInfo;
    }

    isClientUser() {
        return false;
    }

}

export class UserInfo {

    private infoLoaded: boolean;

    private accountId: number;
    private nickname: string;

    private profileImageURL: string;
    private fullProfileImageURL: string;
    private originalProfileImageURL: string;

    private lastInfoCache: number;

    constructor() {
        this.infoLoaded = false;
        this.accountId = 0;
        this.nickname = '';

        this.profileImageURL = '';
        this.fullProfileImageURL = '';
        this.originalProfileImageURL = '';

        this.lastInfoCache = -1;
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

    get InfoLoaded() {
        return this.infoLoaded;
    }

    get LastInfoCache() {
        return this.lastInfoCache;
    }

    updateNickname(nickname: string) {
        this.nickname = nickname;
    }

    update(memberStruct: MemberStruct) {
        if (!this.infoLoaded) {
            this.infoLoaded = true;
        }

        this.accountId = memberStruct.AccountId;
        this.nickname = memberStruct.NickName;
        this.profileImageURL = memberStruct.ProfileImageUrl || '';
        this.fullProfileImageURL = memberStruct.FullProfileImageUrl || '';
        this.originalProfileImageURL = memberStruct.OriginalProfileImageUrl || '';
    }

}

export class ClientChatUser extends ChatUser {

    private clientAccessData: LoginAccessDataStruct;

    constructor(clientAccessData: LoginAccessDataStruct) {
        super(Long.fromNumber(clientAccessData.UserId));

        this.clientAccessData = clientAccessData;
    }

    get KakaoStoryURL() {
        return this.clientAccessData.StoryURL;
    }

    get LogonTime() {
        return this.clientAccessData.LogonServerTime;
    }

    get MainDeviceName() {
        return this.clientAccessData.MainDevice;
    }

    get MainDeviceAppVer() {
        return this.clientAccessData.MainDeviceAppVersion;
    }

    isClientUser() {
        return true;
    }

}

export class ClientChannelUser extends ChatUser {

    private clientUser: ClientChatUser;

    constructor(clientUser: ClientChatUser) {
        super(clientUser.UserId);

        this.clientUser = clientUser;
    }

    get ClientMainUser() {
        return this.clientUser;
    }

    isClientUser() {
        return true;
    }

}