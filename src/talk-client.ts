import { LocoPacketHandler } from "./loco/loco-packet-handler";
import { LocoRequestPacket, LocoResponsePacket } from ".";
import { LocoManager } from "./loco/loco-manager";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct } from "./talk/struct/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";
import { SessionManager } from "./talk/manage/session-manager";
import { ClientChatUser } from "./talk/user/chat-user";
import { EventEmitter } from "events";

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

            let clientChatUser = new ClientChatUser(loginAccessData);
            this.sessionManager = new SessionManager(clientChatUser);

            accessToken = loginAccessData.AccessToken;
        } catch(e) {
            throw new Error(`Received wrong response: ${e}`);
        }
        
        await this.networkManager.locoLogin(deviceUUID, this.sessionManager.ClientUser.UserId, accessToken);
    }

    async logout() {
        if (!this.LocoLogon) {
            throw new Error('Not logon');
        }

        await this.networkManager.logout();
        this.sessionManager = null;
    }

}