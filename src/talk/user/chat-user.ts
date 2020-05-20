import { LoginAccessDataStruct } from "../struct/auth/login-access-data-struct";
import { Long } from "bson";
import { MemberStruct } from "../struct/member-struct";
import { MoreSettingsStruct } from "../struct/api/account/client-settings-struct";
import { OpenMemberStruct } from "../struct/open-link-struct";
import { UserType } from "./user-type";
import { EventEmitter } from "events";
import { ChatChannel } from "../channel/chat-channel";
import { Chat } from "../chat/chat";
import { ChatFeed } from "../chat/chat-feed";
import { LocoClient } from "../../client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatUser extends EventEmitter {

    private client: LocoClient;
    
    private id: Long;

    private nickname: string;

    constructor(client: LocoClient, userId: Long, nickname: string = '') {
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

    //@depreacted
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

    private nickname: string;

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

        this.nickname = '';

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

    get Nickname() {
        return this.nickname;
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
        this.nickname = memberStruct.NickName;

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

    constructor(client: LocoClient, userId: Long, settings: MoreSettingsStruct, private mainOpenToken: number) {
        super(client, userId);

        this.mainUserInfo = new ClientUserInfo(settings);
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

    private settings: MoreSettingsStruct;

    constructor(settings: MoreSettingsStruct) {
        this.settings = settings;
    }

    get AccountId() {
        return this.settings.accountId;
    }

    get ProfileImageURL() {
        return this.settings.profileImageUrl || '';
    }

    get FullProfileImageURL() {
        return this.settings.fullProfileImageUrl || '';
    }

    get OriginalProfileImageURL() {
        return this.settings.originalProfileImageUrl || '';
    }

    get BackgroundImageURL() {
        return this.settings.backgroundImageURL || '';
    }

    get OriginalBackgroundImageURL() {
        return this.settings.originalBackgroundImageURL || '';
    }

    get LastInfoCache() {
        return Date.now();
    }

    get KakaoStoryURL() {
        return this.settings.storyURL;
    }

    update(memberStruct: MemberStruct) {
        
    }

    updateFromStruct(memberStruct: MemberStruct) {

    }

}