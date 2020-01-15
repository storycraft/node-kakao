import { LocoPacketHandler } from "./loco/loco-packet-handler";
import { LocoRequestPacket, LocoResponsePacket, Long } from ".";
import { LocoManager } from "./loco/loco-manager";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct } from "./talk/struct/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { SessionManager } from "./talk/manage/session-manager";
import { ClientChatUser, ChatUser } from "./talk/user/chat-user";
import { EventEmitter } from "events";
import { ChatChannel } from "./talk/room/chat-channel";
import { Chat } from "./talk/chat/chat";
import { ClientSettingsStruct } from "./talk/struct/client-settings-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class TalkClient extends EventEmitter {

    private name: string;

    private networkManager: NetworkManager;

    private sessionManager: SessionManager | null;

    constructor(name: string) {
        super();
        
        this.name = name;

        this.networkManager = new NetworkManager(this);

        this.sessionManager = null;
    }

    get Name() {
        return this.name;
    }

    get NetworkManager() {
        return this.networkManager;
    }

    get SessionManager() {
        return this.sessionManager;
    }

    get LocoLogon() {
        return this.networkManager.Logon;
    }

    async login(email: string, password: string, deviceUUID: string, xvc: string) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        let accessToken = '';

        try {
            let loginAccessData = new LoginAccessDataStruct();
            loginAccessData.fromJson(JSON.parse(await KakaoAPI.requestLogin(xvc, email, password, deviceUUID, this.Name, true)));

            let statusCode = loginAccessData.Status;
            if (statusCode !== 0) {
                if (statusCode == -100) {
                    throw new Error(`This device is not registered.`);
                } else if (statusCode == 30) {
                    throw new Error(`ERR 30. Someof field values are wrong`);
                }

                throw new Error(`Access login ERR ${statusCode}`);
            }

            let settings = new ClientSettingsStruct();
            settings.fromJson(JSON.parse(await KakaoAPI.requestAccountSettings(loginAccessData.AccessToken, deviceUUID, 0)));

            if (settings.Status !== 0) {
                throw new Error(`Settings request ERR ${settings.Status}`);
            }

            let clientChatUser = new ClientChatUser(loginAccessData, settings);
            this.sessionManager = new SessionManager(this, clientChatUser);

            accessToken = loginAccessData.AccessToken;
        } catch(e) {
            throw new Error(`Received wrong response: ${e}`);
        }
        
        await this.networkManager.locoLogin(deviceUUID, this.sessionManager.ClientUser.UserId.toNumber(), accessToken);
    }

    async logout() {
        if (!this.LocoLogon) {
            throw new Error('Not logon');
        }

        await this.networkManager.logout();
        this.sessionManager = null;
    }

    on(event: 'message' | string, listener: (chat: Chat) => void): this;
    on(event: 'message_read' | string, listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    on(event: 'user_join' | string, listener: (channel: ChatChannel, user: ChatUser, joinMessage: string) => void): this;
    on(event: 'user_left' | string, listener: (channel: ChatChannel, user: ChatUser) => void): this;
    on(event: 'join_channel' | string, listener: (joinChannel: ChatChannel) => void): this;
    on(event: 'left_channel' | string, listener: (leftChannel: ChatChannel) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'message' | string, listener: (chat: Chat) => void): this;
    once(event: 'message_read' | string, listener: (channel: ChatChannel, reader: ChatUser, watermark: Long) => void): this;
    once(event: 'user_join' | string, listener: (channel: ChatChannel, user: ChatUser, joinMessage: string) => void): this;
    once(event: 'user_left' | string, listener: (channel: ChatChannel, user: ChatUser) => void): this;
    once(event: 'join_channel' | string, listener: (joinChannel: ChatChannel) => void): this;
    once(event: 'left_channel' | string, listener: (leftChannel: ChatChannel) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}