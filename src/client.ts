import { Long } from "bson";
import { EventEmitter } from "events";
import { AuthClient } from "./api/auth-client";
import { ChannelBoardClient, OpenChannelBoardClient } from "./api/channel-board-client";
import { OpenChatClient } from "./api/open-chat-client";
import { OpenUploadApi } from "./api/open-upload-api";
import { ServiceClient } from "./api/service-client";
import { ClientStatus } from "./client-status";
import { ClientConfig } from "./config/client-config";
import { ClientConfigProvider, DefaultClientConfigProvider } from "./config/client-config-provider";
import { ClientEvents } from "./event/events";
import { NetworkManager } from "./network/network-manager";
import { StatusCode } from "./packet/loco-packet-base";
import { PacketSetStatusReq, PacketSetStatusRes } from "./packet/packet-set-status";
import { ChannelManager } from "./talk/channel/channel-manager";
import { MemoChatChannel } from "./talk/channel/chat-channel";
import { ChatManager } from "./talk/chat/chat-manager";
import { OpenLinkManager } from "./talk/open/open-link-manager";
import { RequestResult } from "./talk/request/request-result";
import { MoreSettingsStruct } from "./talk/struct/api/account/client-settings-struct";
import { WebApiStatusCode } from "./talk/struct/web-api-struct";
import { ClientChatUser, ClientUserInfo } from "./talk/user/chat-user";
import { UserManager } from "./talk/user/user-manager";
import { UserType } from "./talk/user/user-type";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LoginError {

    status: number;
    message?: string;

}

export interface ApiClient {

    readonly Name: string;

    ConfigProvider: ClientConfigProvider;

    readonly Auth: AuthClient;

    readonly Service: ServiceClient;

    readonly OpenChat: OpenChatClient;
    readonly OpenUploadApi: OpenUploadApi;

    readonly ChannelBoard: ChannelBoardClient;
    readonly OpenChannelBoard: OpenChannelBoardClient;

    readonly Logon: boolean;

    login(email: string, password: string, forced?: boolean): Promise<void>;
    loginToken(email: string, token: string, forced?: boolean, locked?: boolean): Promise<void>;

    relogin(): Promise<void>;

    logout(): void;

}

export interface LocoClient extends ApiClient, ClientEvents {

    readonly NetworkManager: NetworkManager;

    readonly ChannelManager: ChannelManager;

    readonly UserManager: UserManager;

    readonly ChatManager: ChatManager;

    readonly OpenLinkManager: OpenLinkManager;

    readonly ClientUser: ClientChatUser;

    readonly LocoLogon: boolean;

    setStatus(status: ClientStatus): Promise<RequestResult<boolean>>;
    getStatus(): ClientStatus;
    updateStatus(): Promise<RequestResult<boolean>>;

}

export class TalkApiClient extends EventEmitter implements ApiClient {

    private configProvider: DefaultClientConfigProvider;

    private auth: AuthClient;

    private service: ServiceClient;

    private openchatWeb: OpenChatClient;
    private openUploadApi: OpenUploadApi;

    private channelBoard: ChannelBoardClient;
    private openChannelBoard: OpenChannelBoardClient;
    
    constructor(name: string, deviceUUID: string, config?: Partial<ClientConfig>) {
        super();

        this.configProvider = new DefaultClientConfigProvider(config);

        this.auth = new AuthClient(name, deviceUUID, this.configProvider);

        this.service = new ServiceClient(this.auth, this.configProvider);

        this.openchatWeb = new OpenChatClient(this.auth, this.configProvider);
        this.openUploadApi = new OpenUploadApi(this.configProvider);

        this.channelBoard = new ChannelBoardClient(this.auth, this.configProvider);
        this.openChannelBoard = new OpenChannelBoardClient(this.auth, this.configProvider);
    }

    get Name() {
        return this.auth.Name;
    }

    get ConfigProvider() {
        return this.configProvider;
    }

    set ConfigProvider(provider) {
        this.configProvider = provider;
    }

    get Auth() {
        return this.auth;
    }

    get Service() {
        return this.service;
    }

    get OpenChat() {
        return this.openchatWeb;
    }

    get OpenUploadApi() {
        return this.openUploadApi;
    }

    get ChannelBoard() {
        return this.channelBoard;
    }

    get OpenChannelBoard() {
        return this.openChannelBoard;
    }

    get Logon() {
        return this.auth.Logon;
    }

    async login(email: string, password: string, forced: boolean = false) {
        if (this.Logon) {
            throw new Error('Already logon');
        }

        await this.auth.login(email, password, forced);
    }

    async loginToken(email: string, token: string, forced: boolean = false, locked: boolean = false) {
        if (this.Logon) {
            throw new Error('Already logon');
        }

        await this.auth.loginToken(email, token, forced, locked);
    }

    async relogin() {
        await this.auth.relogin();
    }

    logout() {
        this.auth.logout();
    }

}

export class TalkClient extends TalkApiClient implements LocoClient {

    private networkManager: NetworkManager;

    private clientUser: ClientChatUser | null;

    private channelManager: ChannelManager;
    private userManager: UserManager;

    private chatManager: ChatManager;
    private openLinkManager: OpenLinkManager;

    private status: ClientStatus;

    constructor(name: string, deviceUUID: string, config?: Partial<ClientConfig>) {
        super(name, deviceUUID, config);

        this.networkManager = new NetworkManager(this, this.ConfigProvider);
        this.channelManager = new ChannelManager(this);
        this.userManager = new UserManager(this);

        this.chatManager = new ChatManager(this);
        this.openLinkManager = new OpenLinkManager(this);

        this.clientUser = null;

        this.status = ClientStatus.UNLOCKED;
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

    get OpenLinkManager() {
        return this.openLinkManager;
    }

    get LocoLogon() {
        return this.networkManager.Logon;
    }

    get ClientUser() {
        if (!this.LocoLogon) throw new Error('Client not logon to loco');

        return this.clientUser!;
    }

    async login(email: string, password: string, forced: boolean = false) {
        if (this.LocoLogon) throw { status: WebApiStatusCode.OPERATION_DENIED, message: `Already logon to loco` } as LoginError;

        await super.login(email, password, forced);
        await this.locoLogin();
    }

    async loginToken(email: string, token: string, forced: boolean = false, locked: boolean = false) {
        if (this.LocoLogon) throw { status: WebApiStatusCode.OPERATION_DENIED, message: `Already logon to loco` } as LoginError;

        await super.loginToken(email, token, forced, locked);
        await this.locoLogin();
    }

    async relogin() {
        await super.relogin();

        this.networkManager.disconnect();
        await this.locoLogin();
    }

    protected async locoLogin() {
        let accessData = this.Auth.getLatestAccessData();

        let res: MoreSettingsStruct = await this.Auth.requestMoreSettings(0);

        if (res.status !== WebApiStatusCode.SUCCESS) {
            throw { status: WebApiStatusCode.OPERATION_DENIED, message: `more_settings.json request failed` } as LoginError;
        }

        let loginRes = await this.networkManager.locoLogin(this.Auth.DeviceUUID, accessData.userId, accessData.accessToken);

        this.clientUser = new TalkClientChatUser(this, accessData.userId, res, loginRes.OpenChatToken);

        this.userManager.initializeClient();
        await this.channelManager.initializeLoginData(loginRes.ChatDataList);
        await this.openLinkManager.initOpenSession();

        this.emit('login', this.clientUser);
    }

    async setStatus(status: ClientStatus): Promise<RequestResult<boolean>> {
        if (this.status !== status) this.status = status;

        return this.updateStatus();
    }

    async updateStatus(): Promise<RequestResult<boolean>> {
        let res = await this.networkManager.requestPacketRes<PacketSetStatusRes>(new PacketSetStatusReq(this.status));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    getStatus(): ClientStatus {
        return this.status;
    }

    logout() {
        super.logout();
        
        this.networkManager.disconnect();
    }

}

export class TalkClientChatUser extends EventEmitter implements ClientChatUser {

    private client: TalkClient;
    private id: Long;

    private mainUserInfo: ClientUserInfo;

    constructor(client: TalkClient, id: Long, settings: MoreSettingsStruct, private mainOpenToken: number) {
        super();

        this.client = client;
        this.id = id;

        this.mainUserInfo = new TalkClientUserInfo(this, settings);
    }

    get Client(): LocoClient {
        return this.client;
    }

    get Id() {
        return this.id;
    }

    get MainUserInfo() {
        return this.mainUserInfo;
    }

    get MainOpenToken() {
        return this.mainOpenToken;
    }

    get Nickname() {
        return this.mainUserInfo.Nickname;
    }

    async createDM(): Promise<RequestResult<MemoChatChannel>> {
        return this.client.ChannelManager.createMemoChannel();
    }

    isClientUser() {
        return true;
    }

}

export class TalkClientUserInfo implements ClientUserInfo {

    constructor(private user: TalkClientChatUser, private settings: MoreSettingsStruct) {
        
    }

    get Client() {
        return this.user.Client;
    }

    get User() {
        return this.user;
    }

    get Id() {
        return this.user.Id;
    }

    get AccountId() {
        return this.settings.accountId;
    }

    get Nickname() {
        return this.settings.nickName;
    }

    get UserType() {
        return UserType.Undefined;
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

    get EmailAddress() {
        return this.settings.emailAddress;
    }

    get AccountDisplayId() {
        return this.settings.accountDisplayId;
    }

    get TalkId() {
        return this.settings.uuid;
    }

    get StatusMessage() {
        return this.settings.statusMessage;
    }

    get NsnPhoneNumber() {
        return this.settings.nsnNumber;
    }

    get PstnPhoneNumber() {
        return this.settings.pstnNumber;
    }

    get FormattedNsnPhoneNumber() {
        return this.settings.formattedNsnNumber;
    }

    get FormattedPstnPhoneNumber() {
        return this.settings.formattedPstnNumber;
    }

    isOpenUser(): false {
        return false;
    }

}