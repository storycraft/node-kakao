import { LoginAccessDataStruct } from "../struct/login-access-data-struct";
import { Long } from "bson";
import { MemberStruct } from "../struct/member-struct";
import { ClientSettingsStruct } from "../struct/client-settings-struct";
import { OpenLinkStruct, OpenMemberStruct } from "../struct/open-link-struct";
import { UserType } from "./user-type";
import { EventEmitter } from "events";
import { ChatChannel } from "../channel/chat-channel";
import { Chat } from "../chat/chat";
import { ChatFeed } from "../chat/chat-feed";
import { TalkClient } from "../../talk-client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatUser extends EventEmitter {

    private client: TalkClient;
    
    private id: Long;

    private nickname: string;

    constructor(client: TalkClient, userId: Long, nickname: string = '') {
        super();
        
        this.client = client;

        this.id = userId;
        this.nickname = nickname;
    }

    get Client() {
        return this.client;
    }

    get Id() {
        return this.id;
    }

    get Nickname() {
        return this.nickname;
    }

    updateNickname(nickname: string) {
        if (this.nickname !== nickname) this.nickname = nickname;
    }

    isClientUser() {
        return false;
    }

    async createDM() {
        return this.client.ChannelManager.createChannel([this]);
    }

    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'message_read', listener: (channel: ChatChannel, watermark: Long) => void): this;
    on(event: 'join', listener: (newChannel: ChatChannel, joinFeed: ChatFeed) => void): this;
    on(event: 'left', listener: (leftChannel: ChatChannel, leftFeed: ChatFeed) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, watermark: Long) => void): this;
    once(event: 'join', listener: (newChannel: ChatChannel, joinFeed: ChatFeed) => void): this;
    once(event: 'left', listener: (leftChannel: ChatChannel, leftFeed: ChatFeed) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}

export interface UserInfoBase {

    readonly ProfileImageURL: string;

    readonly FullProfileImageURL: string;

    readonly OriginalProfileImageURL: string;

    readonly LastInfoCache: number;
}

export interface ChatUserInfoBase extends UserInfoBase {

    readonly AccountId: number;

    update(memberStruct: MemberStruct): void;

    updateFromStruct(memberStruct: MemberStruct): void;
}

export class UserInfo implements ChatUserInfoBase {

    private user: ChatUser;

    private accountId: number;

    private profileImageURL: string;
    private fullProfileImageURL: string;
    private originalProfileImageURL: string;

    private openProfileToken?: number;
    private profileLinkId?: Long;

    private lastInfoCache: number;

    private userType: UserType;

    constructor(user: ChatUser) {
        this.user = user;

        this.accountId = 0;

        this.profileImageURL = '';
        this.fullProfileImageURL = '';
        this.originalProfileImageURL = '';

        this.lastInfoCache = -1;
        this.userType = UserType.Undefined;
    }

    get User() {
        return this.user;
    }

    get AccountId() {
        return this.accountId;
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

    get ProfileLinkId() {
        return this.profileLinkId;
    }

    get OpenProfileToken() {
        return this.openProfileToken;
    }

    get UserType() {
        return this.userType;
    }

    isOpenUser(): boolean {
        if (this.openProfileToken) return true;
        return false;
    }

    hasOpenProfile(): boolean {
        if (this.profileLinkId) return true;
        return false;
    }

    update(memberStruct: MemberStruct) {
        this.updateFromStruct(memberStruct);
    }

    updateFromStruct(memberStruct: MemberStruct) {
        this.accountId = memberStruct.AccountId;
        this.user.updateNickname(memberStruct.NickName);
        this.profileImageURL = memberStruct.ProfileImageUrl || '';
        this.fullProfileImageURL = memberStruct.FullProfileImageUrl || '';
        this.originalProfileImageURL = memberStruct.OriginalProfileImageUrl || '';
        
        if (memberStruct.OpenProfileToken !== 0) {
            this.openProfileToken = memberStruct.OpenProfileToken;
        }

        if (memberStruct.ProfileLinkId !== Long.ZERO) {
            this.profileLinkId = memberStruct.ProfileLinkId;
        }

        this.userType = memberStruct.Type;
    }

    updateFromOpenStruct(memberStruct: OpenMemberStruct) {
        this.user.updateNickname(memberStruct.NickName);
        this.profileImageURL = memberStruct.ProfileImageUrl || '';
        this.fullProfileImageURL = memberStruct.FullProfileImageUrl || '';
        this.originalProfileImageURL = memberStruct.OriginalProfileImageUrl || '';
        
        this.openProfileToken = memberStruct.OpenChatToken;
    }

}

export class ClientChatUser extends ChatUser {

    private mainUserInfo: ClientUserInfo;

    constructor(client: TalkClient, clientAccessData: LoginAccessDataStruct, settings: ClientSettingsStruct, private mainOpenToken: number) {
        super(client, clientAccessData.UserId);

        this.mainUserInfo = new ClientUserInfo(clientAccessData, settings);
    }

    get MainUserInfo() {
        return this.mainUserInfo;
    }

    get MainOpenToken() {
        return this.mainOpenToken;
    }

    isClientUser() {
        return true;
    }

}

export class ClientUserInfo implements ChatUserInfoBase {

    private clientAccessData: LoginAccessDataStruct;
    private settings: ClientSettingsStruct;

    constructor(clientAccessData: LoginAccessDataStruct, settings: ClientSettingsStruct) {
        this.clientAccessData = clientAccessData;
        this.settings = settings;
    }

    get AccountId() {
        return this.clientAccessData.AccountId;
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

    update(memberStruct: MemberStruct) {
        
    }

    updateFromStruct(memberStruct: MemberStruct) {

    }

}