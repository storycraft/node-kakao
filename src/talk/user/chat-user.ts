import { SelfChatChannel } from "../room/chat-channel";
import { LoginAccessDataStruct } from "../struct/login-access-data-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatUser {
    
    private userId: number;

    private lastInfoCache: number;  
    private userInfo: UserInfo;

    constructor(userId: number, userInfo: UserInfo = new UserInfo(), lastInfoCache: number = 0) {
        this.userId = userId;

        this.userInfo = userInfo;
        this.lastInfoCache = lastInfoCache;
    }

    get UserId() {
        return this.userId;
    }

    get LastInfoCache() {
        return this.lastInfoCache;
    }

    get UserInfo() {
        return this.userInfo;
    }

    updateUserInfo(userInfo: UserInfo, lastInfoCache: number = Date.now()) {
        this.userInfo = userInfo;
        this.lastInfoCache = lastInfoCache;
    }

}

export class UserInfo {

}

export class ClientChatUser extends ChatUser {

    private clientAccessData: LoginAccessDataStruct;

    constructor(clientAccessData: LoginAccessDataStruct) {
        super(clientAccessData.UserId);

        this.clientAccessData = clientAccessData;
    }

}