import { Long, AccessDataProvider } from ".";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct } from "./talk/struct/auth/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { ClientChatUser, ChatUser } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { ChatChannel } from "./talk/channel/chat-channel";
import { Chat } from "./talk/chat/chat";
import { ClientSettingsStruct } from "./talk/struct/api/client-settings-struct";
import { UserManager } from "./talk/user/user-manager";
import { ChannelManager } from "./talk/channel/channel-manager";
import { ChatManager } from "./talk/chat/chat-manager";
import { JsonUtil } from "./util/json-util";
import { OpenChatManager } from "./talk/open/open-chat-manager";
import { ChatFeed } from "./talk/chat/chat-feed";
import { LocoKickoutType } from "./packet/packet-kickout";
import { ApiClient, ApiResponse } from "./api/api-client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LocoClient extends EventEmitter {

    readonly Name: string;

    readonly NetworkManager: NetworkManager;

    readonly ChannelManager: ChannelManager;

    readonly UserManager: UserManager;

    readonly ChatManager: ChatManager;

    readonly OpenChatManager: OpenChatManager;

    readonly ClientUser: ClientChatUser;

    readonly LocoLogon: boolean;

    login(email: string, password: string, deviceUUID?: string, forced?: boolean): Promise<void>;

    logout(): Promise<void>;

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

export class TalkClient extends EventEmitter implements LocoClient, AccessDataProvider {

    private name: string;

    private readonly accessData: LoginAccessDataStruct;

    private apiClient: ApiClient;

    private networkManager: NetworkManager;

    private clientUser: ClientChatUser;

    private channelManager: ChannelManager;
    private userManager: UserManager;

    private chatManager: ChatManager;
    private openChatManager: OpenChatManager;

    constructor(deviceUUID: string, name: string) {
        super();
        
        this.name = name;

        this.accessData = new LoginAccessDataStruct();

        this.apiClient = new ApiClient(deviceUUID, this);

        this.networkManager = new NetworkManager(this);

        this.channelManager = new ChannelManager(this);
        this.userManager = new UserManager(this);

        this.chatManager = new ChatManager(this);
        this.openChatManager = new OpenChatManager(this);

        this.clientUser = new ClientChatUser(this, new ClientSettingsStruct(), -1); //dummy
    }

    get Name() {
        return this.name;
    }

    get ApiClient() {
        return this.apiClient;
    }

    get NetworkManager() {
        return this.networkManager;
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

    get ClientUser() {
        return this.clientUser;
    }

    get LocoLogon() {
        return this.networkManager.Logon;
    }

    getLatestAccessData() {
        return this.accessData;
    }

    async login(email: string, password: string, deviceUUID?: string, forced: boolean = false) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        if (deviceUUID) this.apiClient.DeviceUUID = deviceUUID;

        this.accessData.fromJson(JsonUtil.parseLoseless(await KakaoAPI.requestLogin(email, password, this.apiClient.DeviceUUID, this.Name, forced)));

        let statusCode = this.accessData.Status;
        if (statusCode !== 0) {
            throw statusCode;
        }

        let res: ApiResponse<ClientSettingsStruct> = await this.apiClient.requestMoreSettings(0);

        if (res.Status !== 0) {
            throw new Error(`more_settings.json ERR: ${res.Status}`);
        }

        let settings = res.Response!;

        let loginRes = await this.networkManager.locoLogin(this.apiClient.DeviceUUID, this.clientUser.Id, this.accessData.AccessToken);

        this.clientUser = new ClientChatUser(this, settings, loginRes.OpenChatToken);

        this.userManager.initalizeClient();
        this.channelManager.initalizeLoginData(loginRes.ChatDataList);
        await this.openChatManager.initOpenSession();

        this.emit('login', this.clientUser);
    }

    async logout() {
        return this.networkManager.logout();
    }

    on(event: 'login', listener: (user: ClientChatUser) => void): this;
    on(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    on(event: 'message', listener: (chat: Chat) => void): this;
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