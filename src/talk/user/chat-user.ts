import { LoginAccessDataStruct } from "../struct/login-access-data-struct";
import { Long } from "bson";
import { MemberStruct } from "../struct/member-struct";
import { ClientSettingsStruct } from "../struct/client-settings-struct";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { OpenChatProfile } from "../open/open-chat-profile";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatUser {
    
    private userId: Long;
    private userInfo: ChatUserInfoBase;

    constructor(userId: Long, userInfo: ChatUserInfoBase = new UserInfo()) {
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

export interface UserInfoBase {

    readonly Nickname: string;

    readonly ProfileImageURL: string;

    readonly FullProfileImageURL: string;

    readonly OriginalProfileImageURL: string;

    readonly LastInfoCache: number;
}

export interface ChatUserInfoBase extends UserInfoBase {

    readonly AccountId: number;

    readonly InfoLoaded: boolean;

    updateNickname(nickname: string): void;

    update(memberStruct: MemberStruct): void;

    updateFromChatInfo(memberStruct: MemberStruct): void;
}

export class UserInfo implements ChatUserInfoBase {

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

    get AccountId() {
        return this.accountId;
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

        this.updateFromChatInfo(memberStruct);
    }

    updateFromChatInfo(memberStruct: MemberStruct) {
        this.accountId = memberStruct.AccountId;
        this.nickname = memberStruct.NickName;
        this.profileImageURL = memberStruct.ProfileImageUrl || '';
        this.fullProfileImageURL = memberStruct.FullProfileImageUrl || '';
        this.originalProfileImageURL = memberStruct.OriginalProfileImageUrl || '';
    }

}

export class ClientChatUser extends ChatUser {

    private openChatToken: Long;

    private openChatProfileList: OpenChatProfile[];

    constructor(clientAccessData: LoginAccessDataStruct, settings: ClientSettingsStruct, openChatToken: Long = Long.ZERO) {
        super(Long.fromNumber(clientAccessData.UserId), new ClientUserInfo(clientAccessData, settings));

        this.openChatToken = openChatToken;
        this.openChatProfileList = [];
    }

    get UserInfo() {
        return super.UserInfo as ClientUserInfo;
    }

    get KakaoStoryURL() {
        return this.UserInfo.KakaoStoryURL;
    }

    get OpenChatToken() {
        return this.openChatToken;
    }

    set OpenChatToken(token) {
        this.openChatToken = token;
    }

    get LogonTime() {
        return this.UserInfo.LogonTime;
    }

    get MainDeviceName() {
        return this.UserInfo.MainDeviceName;
    }

    get MainDeviceAppVer() {
        return this.UserInfo.MainDeviceAppVer;
    }

    get OpenChatProfileList() {
        return this.openChatProfileList;
    }

    isClientUser() {
        return true;
    }

    updateOpenChatProfile(openChatProfileList: OpenLinkStruct[]) {
        this.openChatProfileList = [];

        for (let profileStruct of openChatProfileList) {
            this.openChatProfileList.push(OpenChatProfile.fromStruct(profileStruct));
        }
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

export class ClientUserInfo implements ChatUserInfoBase {

    private clientAccessData: LoginAccessDataStruct;
    private settings: ClientSettingsStruct;

    private nickname: string;

    constructor(clientAccessData: LoginAccessDataStruct, settings: ClientSettingsStruct) {
        this.clientAccessData = clientAccessData;
        this.settings = settings;

        this.nickname = '';
    }

    get AccountId() {
        return this.clientAccessData.AccountId;
    }

    get Nickname() {
        return this.nickname;
    }

    get ProfileImageURL() {
        return this.settings.ProfileImageURL;
    }

    get FullProfileImageURL() {
        return this.settings.FullProfileImageURL;
    }

    get OriginalProfileImageURL() {
        return this.settings.OriginalProfileImageURL;
    }

    get BackgroundImageURL() {
        return this.settings.BackgroundImageURL;
    }

    get OriginalBackgroundImageURL() {
        return this.settings.OriginalBackgroundImageURL;
    }

    get InfoLoaded() {
        return true;
    }

    get LastInfoCache() {
        return Date.now();
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

    updateNickname(nickname: string) {
        this.nickname = nickname;
    }

    update(memberStruct: MemberStruct) {
        
    }

    updateFromChatInfo(memberStruct: MemberStruct) {

    }

}