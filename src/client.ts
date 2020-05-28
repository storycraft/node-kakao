import { Long, AccessDataProvider } from ".";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct, LoginStatusCode } from "./talk/struct/auth/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { ClientChatUser, ChatUser } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { ChatChannel } from "./talk/channel/chat-channel";
import { Chat } from "./talk/chat/chat";
import { MoreSettingsStruct } from "./talk/struct/api/account/client-settings-struct";
import { UserManager } from "./talk/user/user-manager";
import { ChannelManager } from "./talk/channel/channel-manager";
import { ChatManager } from "./talk/chat/chat-manager";
import { JsonUtil } from "./util/json-util";
import { OpenChatManager } from "./talk/open/open-chat-manager";
import { ChatFeed } from "./talk/chat/chat-feed";
import { LocoKickoutType } from "./packet/packet-kickout";
import { ApiClient } from "./api/api-client";
import { LocoInterface } from "./loco/loco-interface";
import { Serializer } from "json-proxy-mapper";
import { ApiStatusCode } from "./talk/struct/api/api-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LoginBasedClient {

    readonly Logon: boolean;
    
    login(email: string, password: string, deviceUUID?: string, forced?: boolean): Promise<void>;
    loginToken(email: string, token: string, deviceUUID?: string, forced?: boolean): Promise<void>;

    relogin(): Promise<void>;

    logout(): Promise<void>;

}

export interface LoginError {

    status: number;
    message?: string;

}

export interface LocoClient extends LoginBasedClient, EventEmitter {

    readonly Name: string;

    readonly LocoInterface: LocoInterface;

    readonly ChannelManager: ChannelManager;

    readonly UserManager: UserManager;

    readonly ChatManager: ChatManager;

    readonly OpenChatManager: OpenChatManager;

    readonly ClientUser: ClientChatUser;

    readonly LocoLogon: boolean;

    on(event: 'login', listener: (user: ClientChatUser) => void): this;
    on(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    on(event: 'message_deleted', listener: (logId: Long, hidden: boolean) => void): this;
    on(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    on(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;

    once(event: 'login', listener: (user: ClientChatUser) => void): this;
    once(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    once(event: 'message_deleted', listener: (logId: Long, hidden: boolean) => void): this;
    once(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    once(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;

}

export class LoginClient extends EventEmitter implements LoginBasedClient, AccessDataProvider {

    private name: string;

    private currentLogin: (() => Promise<void>) | null;

    private accessData: LoginAccessDataStruct | null;

    private apiClient: ApiClient;

    constructor(name: string, deviceUUID: string) {
        super();

        this.name = name;

        this.currentLogin = null;
        this.accessData = null;

        this.apiClient = new ApiClient(deviceUUID, this);
    }

    get Name() {
        return this.name;
    }

    get ApiClient() {
        return this.apiClient;
    }

    get Logon() {
        return this.currentLogin !== null;
    }

    async login(email: string, password: string, deviceUUID?: string, forced: boolean = false) {
        if (deviceUUID && this.apiClient.DeviceUUID !== deviceUUID) this.apiClient.DeviceUUID = deviceUUID;

        this.currentLogin = this.login.bind(this, email, password, this.apiClient.DeviceUUID, forced);

        await this.loginAccessData(Serializer.deserialize<LoginAccessDataStruct>(JsonUtil.parseLoseless(await KakaoAPI.requestLogin(email, password, this.apiClient.DeviceUUID, this.name, forced)), LoginAccessDataStruct.MAPPER));
    }

    async loginToken(email: string, token: string, deviceUUID?: string, forced: boolean = false, locked: boolean = true) {
        if (deviceUUID && this.apiClient.DeviceUUID !== deviceUUID) this.apiClient.DeviceUUID = deviceUUID;

        this.currentLogin = this.loginToken.bind(this, email, token, this.apiClient.DeviceUUID, forced);

        await this.loginAccessData(Serializer.deserialize<LoginAccessDataStruct>(JsonUtil.parseLoseless(await KakaoAPI.requestAutoLogin(locked, email, token, this.apiClient.DeviceUUID, this.name, forced)), LoginAccessDataStruct.MAPPER));
    }

    protected async loginAccessData(accessData: LoginAccessDataStruct) {
        this.accessData = accessData;

        if (this.accessData.status !== LoginStatusCode.PASS) {
            throw accessData as LoginError;
        }
    }

    async relogin() {
        if (!this.currentLogin) throw new Error('Login data does not exist');

        return this.currentLogin();
    }

    async logout() {
        this.currentLogin = null;
        this.accessData = null;
    }

    getLatestAccessData(): LoginAccessDataStruct {
        if (!this.currentLogin) throw new Error('Not logon');

        return this.accessData!;
    }

}

export class TalkClient extends LoginClient implements LocoClient {

    private networkManager: NetworkManager;

    private clientUser: ClientChatUser | null;

    private channelManager: ChannelManager;
    private userManager: UserManager;

    private chatManager: ChatManager;
    private openChatManager: OpenChatManager;

    constructor(name: string, deviceUUID: string = '') {
        super(name, deviceUUID);

        this.networkManager = new NetworkManager(this);

        this.channelManager = new ChannelManager(this);
        this.userManager = new UserManager(this);

        this.chatManager = new ChatManager(this);
        this.openChatManager = new OpenChatManager(this);

        this.clientUser = null;
    }

    get LocoInterface() {
        return this.networkManager as LocoInterface;
    }

    get ChannelManager() {
        return this.channelManager;
    }

    get UserManager() {
        return this.userManager;
    }

    get ChatManager() {
        return this.chatManager;
    }

    get OpenChatManager() {
        return this.openChatManager;
    }

    get LocoLogon() {
        return this.networkManager.Logon;
    }

    get ClientUser() {
        if (!this.LocoLogon) throw new Error('Client not logon to loco');

        return this.clientUser!;
    }

    async login(email: string, password: string, deviceUUID?: string, forced: boolean = false) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        await super.login(email, password, deviceUUID, forced);
    }

    async loginToken(email: string, token: string, deviceUUID?: string, forced: boolean = false, locked: boolean = false) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        await super.loginToken(email, token, deviceUUID, forced, locked);
    }

    protected async loginAccessData(accessData: LoginAccessDataStruct) {
        await super.loginAccessData(accessData);
        await this.locoLogin();
    }

    protected async locoLogin() {
        let accessData = this.getLatestAccessData();

        let res: MoreSettingsStruct = await this.ApiClient.requestMoreSettings(0);

        if (res.status !== ApiStatusCode.SUCCESS) {
            throw new Error(`more_settings.json ERR: ${res.status}`);
        }

        let loginRes = await this.networkManager.locoLogin(this.ApiClient.DeviceUUID, accessData.userId, accessData.accessToken);

        this.clientUser = new ClientChatUser(this, accessData.userId, res, loginRes.OpenChatToken);

        this.userManager.initalizeClient();
        this.channelManager.initalizeLoginData(loginRes.ChatDataList);
        await this.openChatManager.initOpenSession();

        this.emit('login', this.clientUser);
    }

    async logout() {
        await super.logout();

        return this.networkManager.disconnect();
    }

    on(event: 'login', listener: (user: ClientChatUser) => void): this;
    on(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'feed', listener: (chat: Chat, feed: ChatFeed) => void): this;
    on(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    on(event: 'message_deleted', listener: (logId: Long, hidden: boolean) => void): this;
    on(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    on(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'login', listener: (user: ClientChatUser) => void): this;
    once(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'feed', listener: (chat: Chat, feed: ChatFeed) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    once(event: 'message_deleted', listener: (logId: Long, hidden: boolean) => void): this;
    once(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    once(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;
    once(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

}