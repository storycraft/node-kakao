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

}