import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct, LoginStatusCode } from "./talk/struct/auth/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { ClientChatUser, ClientUserInfo } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { MemoChatChannel } from "./talk/channel/chat-channel";
import { MoreSettingsStruct } from "./talk/struct/api/account/client-settings-struct";
import { UserManager } from "./talk/user/user-manager";
import { ChannelManager } from "./talk/channel/channel-manager";
import { ChatManager } from "./talk/chat/chat-manager";
import { JsonUtil } from "./util/json-util";
import { OpenLinkManager } from "./talk/open/open-link-manager";
import { ApiClient } from "./api/api-client";
import { Serializer } from "json-proxy-mapper";
import { ApiStatusCode } from "./talk/struct/api/api-struct";
import { PacketSetStatusReq, PacketSetStatusRes } from "./packet/packet-set-status";
import { StatusCode } from "./packet/loco-packet-base";
import { ClientStatus } from "./client-status";
import { UserType } from "./talk/user/user-type";
import { RequestResult } from "./talk/request/request-result";
import { AccessDataProvider } from "./oauth/access-data-provider";
import { ClientEvents } from "./event/events";
import { Long } from "bson";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LoginBasedClient extends AccessDataProvider {

    readonly Logon: boolean;
    readonly ApiClient: ApiClient;
    
    login(email: string, password: string, deviceUUID?: string, forced?: boolean): Promise<void>;
    loginToken(email: string, token: string, deviceUUID?: string, forced?: boolean): Promise<void>;

    relogin(): Promise<void>;

    logout(): Promise<void>;

}

export interface LoginError {

    status: number;
    message?: string;

}

export interface LocoClient extends LoginBasedClient, ClientEvents {

    readonly Name: string;

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

export class LoginClient extends EventEmitter implements LoginBasedClient {

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
    private openLinkManager: OpenLinkManager;

    private status: ClientStatus;

    constructor(name: string, deviceUUID: string = '') {
        super(name, deviceUUID);

        this.networkManager = new NetworkManager(this);

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

        this.clientUser = new TalkClientChatUser(this, accessData.userId, res, loginRes.OpenChatToken);

        this.userManager.initalizeClient();
        await this.channelManager.initalizeLoginData(loginRes.ChatDataList);
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

    async logout() {
        await super.logout();
        
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