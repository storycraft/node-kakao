import { LocoPacketHandler } from "./loco/loco-packet-handler";
import { LocoRequestPacket, LocoResponsePacket, Long } from ".";
import { LocoManager } from "./loco/loco-manager";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct } from "./talk/struct/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { ClientChatUser, ChatUser } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { ChatChannel } from "./talk/channel/chat-channel";
import { Chat } from "./talk/chat/chat";
import { ClientSettingsStruct } from "./talk/struct/client-settings-struct";
import { UserManager } from "./talk/user/user-manager";
import { ChannelManager } from "./talk/channel/channel-manager";
import { ChatManager } from "./talk/chat/chat-manager";
import { JsonUtil } from "./util/json-util";
import { OpenChatManager } from "./talk/open/open-chat-manager";
import { ChatFeed } from "./talk/chat/chat-feed";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class TalkClient extends EventEmitter {

    private name: string;

    private networkManager: NetworkManager;

    private clientUser: ClientChatUser;

    private channelManager: ChannelManager;
    private userManager: UserManager;

    private chatManager: ChatManager;
    private openChatManager: OpenChatManager;

    constructor(name: string) {
        super();
        
        this.name = name;

        this.networkManager = new NetworkManager(this);

        this.channelManager = new ChannelManager(this);
        this.userManager = new UserManager(this);

        this.chatManager = new ChatManager(this);
        this.openChatManager = new OpenChatManager(this);

        this.clientUser = new ClientChatUser(this, new LoginAccessDataStruct(), new ClientSettingsStruct(), -1); //dummy
    }

    get Name() {
        return this.name;
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

    async login(email: string, password: string, deviceUUID: string) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        let loginAccessData = new LoginAccessDataStruct();
        loginAccessData.fromJson(JsonUtil.parseLoseless(await KakaoAPI.requestLogin(email, password, deviceUUID, this.Name, true)));

        let statusCode = loginAccessData.Status;
        if (statusCode !== 0) {
            if (statusCode == -100) {
                throw new Error(`STATUS -100: This device is not registered.`);
            } else if (statusCode == 30) {
                throw new Error(`ERR 30: Some field values are wrong`);
            } else if (statusCode == -997) {
                throw new Error(`ERR -997: Account restricted`);
            }

            throw new Error(`Access login ERR: ${statusCode}`);
        }

        let settings = new ClientSettingsStruct();
        settings.fromJson(JsonUtil.parseLoseless(await KakaoAPI.requestAccountSettings(loginAccessData.AccessToken, deviceUUID, 0)));

        if (settings.Status !== 0) {
            throw new Error(`more_settings.json ERR: ${settings.Status}`);
        }

        let loginRes = await this.networkManager.locoLogin(deviceUUID, this.clientUser.Id, loginAccessData.AccessToken);

        this.channelManager.initalizeLoginData(loginRes.ChatDataList);

        this.clientUser = new ClientChatUser(this, loginAccessData, settings, loginRes.OpenChatToken);

        await this.openChatManager.initOpenSession();

        this.emit('login', this.clientUser);
    }

    async logout() {
        if (!this.LocoLogon) {
            throw new Error('Not logon');
        }

        await this.networkManager.logout();
    }

    on(event: 'login', listener: (user: ClientChatUser) => void): this;
    on(event: 'disconnected', listener: (reason: number) => void): this;
    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    on(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    on(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    on(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'login', listener: (user: ClientChatUser) => void): this;
    once(event: 'disconnected', listener: (reason: number) => void): this;
    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    once(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed: ChatFeed) => void): this;
    once(event: 'join_channel', listener: (joinChannel: ChatChannel) => void): this;
    once(event: 'left_channel', listener: (leftChannel: ChatChannel) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}