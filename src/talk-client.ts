import { LocoPacketHandler } from "./loco/loco-packet-handler";
import { LocoRequestPacket, LocoResponsePacket } from ".";
import { LocoManager } from "./loco/loco-manager";
import { NetworkManager } from "./network/network-manager";
import { LoginAccessDataStruct } from "./talk/struct/login-access-data-struct";
import { KakaoAPI } from "./kakao-api";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class TalkClient {

    private name: string;

    private networkManager: NetworkManager;
    private loginAccessData: LoginAccessDataStruct;

    constructor(name: string) {
        this.name = name;

        this.networkManager = new NetworkManager(this);

        this.loginAccessData = new LoginAccessDataStruct();
    }

    get Name() {
        return this.name;
    }

    get NetworkManager() {
        return this.networkManager;
    }

    get LocoLogon() {
        return this.networkManager.Logon;
    }

    async login(email: string, password: string, deviceUUID: string, xvc: string) {
        if (this.LocoLogon) {
            throw new Error('Already logon to loco');
        }

        this.loginAccessData = new LoginAccessDataStruct();
        this.loginAccessData.fromJson(await KakaoAPI.requestLogin(xvc, email, password, deviceUUID, this.Name, true));

        let statusCode = this.loginAccessData.Status;
        if (statusCode !== 0) {
            if (statusCode == -100) {
                throw new Error(`This device is not registered.`);
            } else if (statusCode == 30) {
                throw new Error(`ERR 30. Someof field values are wrong`);
            }

            throw new Error(`Access login ERR ${statusCode}`);
        }
        
        await this.networkManager.locoLogin(deviceUUID, this.loginAccessData);
    }

    async logout() {
        if (!this.LocoLogon) {
            throw new Error('Not logon');
        }

        await this.networkManager.logout();
        this.loginAccessData = new LoginAccessDataStruct();
    }

}