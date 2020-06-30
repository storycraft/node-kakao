import { NetworkManager } from "./network/network-manager";
import { ClientChatUser, ClientUserInfo } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { MemoChatChannel } from "./talk/channel/chat-channel";
import { MoreSettingsStruct } from "./talk/struct/api/account/client-settings-struct";
import { UserManager } from "./talk/user/user-manager";
import { ChannelManager } from "./talk/channel/channel-manager";
import { ChatManager } from "./talk/chat/chat-manager";
import { OpenLinkManager } from "./talk/open/open-link-manager";
import { ApiClient } from "./api/api-client";
import { WebApiStatusCode } from "./talk/struct/web-api-struct";
import { PacketSetStatusReq, PacketSetStatusRes } from "./packet/packet-set-status";
import { StatusCode } from "./packet/loco-packet-base";
import { ClientStatus } from "./client-status";
import { UserType } from "./talk/user/user-type";
import { RequestResult } from "./talk/request/request-result";
import { ClientEvents } from "./event/events";
import { Long } from "bson";
import { AuthClient } from "./api/auth-client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LoginError {

    status: number;
    message?: string;

}

export interface LocoClient extends ClientEvents {

    readonly Name: string;

    readonly Auth: AuthClient;

    readonly Api: ApiClient;

    readonly NetworkManager: NetworkManager;

    readonly ChannelManager: ChannelManager;

    readonly UserManager: UserManager;

    readonly ChatManager: ChatManager;

    readonly OpenLinkManager: OpenLinkManager;

    readonly ClientUser: ClientChatUser;

    readonly LocoLogon: boolean;

    login(email: string, password: string, forced?: boolean): Promise<void>;
    loginToken(email: string, token: string, forced?: boolean, locked?: boolean): Promise<void>;

    relogin(): Promise<void>;

    logout(): void;

    setStatus(status: ClientStatus): Promise<RequestResult<boolean>>;
    getStatus(): ClientStatus;
    updateStatus(): Promise<RequestResult<boolean>>;

}

export class TalkClient extends EventEmitter implements LocoClient {

    private auth: AuthClient;

    private api: ApiClient;

    private networkManager: NetworkManager;

    private clientUser: ClientChatUser | null;

    private channelManager: ChannelManager;
    private userManager: UserManager;

    private chatManager: ChatManager;
    private openLinkManager: OpenLinkManager;

    private status: ClientStatus;

    constructor(name: string, deviceUUID: string = '') {
        super();

        this.auth = new AuthClient(name, deviceUUID);

        this.api = new ApiClient(this.auth);

        this.networkManager = new NetworkManager(this);

        this.channelManager = new ChannelManager(this);
        this.userManager = new UserManager(this);

        this.chatManager = new ChatManager(this);
        this.openLinkManager = new OpenLinkManager(this);

        this.clientUser = null;

        this.status = ClientStatus.UNLOCKED;
    }

    get Auth() {
        return this.auth;
    }

    get Api() {
        return this.api;
    }

    get Name() {
        return this.auth.Name;
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
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        await this.auth.login(email, password, forced);
        await this.locoLogin();
    }

    async loginToken(email: string, token: string, forced: boolean = false, locked: boolean = false) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        await this.auth.loginToken(email, token, forced, locked);
        await this.locoLogin();
    }

    async relogin() {
        await this.auth.relogin();

        this.networkManager.disconnect();
        await this.locoLogin();
    }

    protected async locoLogin() {
        let accessData = this.auth.getLatestAccessData();

        let res: MoreSettingsStruct = await this.auth.requestMoreSettings(0);

        if (res.status !== WebApiStatusCode.SUCCESS) {
            throw new Error(`more_settings.json ERR: ${res.status}`);
        }

        let loginRes = await this.networkManager.locoLogin(this.auth.DeviceUUID, accessData.userId, accessData.accessToken);

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

    logout() {
        this.auth.logout();
        
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