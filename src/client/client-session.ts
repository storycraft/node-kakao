/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../channel/channel";
import { ClientConfigProvider } from "../config/client-config-provider";
import { CommandSession } from "../network/request-session";
import { OAuthCredential } from "../oauth/credential";
import { LoginListRes } from "../packet/chat/login-list";
import { KnownDataStatusCode } from "../packet/status-code";
import { CommandResult } from "../request/command-result";
import { JsonUtil } from "../util/json-util";

export interface ClientSessionOp {

    /**
     * Login using credential.
     * Perform LOGINLIST
     * 
     * @param credential 
     */
    login(credential: OAuthCredential): Promise<CommandResult>;

}

export class ClientSession implements ClientSessionOp {

    private _lastLoginRev: number;
    private _lastTokenId: Long;
    private _lastBlockTk: number;

    constructor(private _session: CommandSession, public configProvider: ClientConfigProvider) {
        this._lastLoginRev = 0;

        this._lastTokenId = Long.ZERO;
        this._lastBlockTk = 0;
    }

    async login(credential: OAuthCredential): Promise<CommandResult<(Channel | OpenChannel)[]>> {
        const config = this.configProvider.configuration;

        const req: Record<string, any> = {
            'appVer': config.appVersion,
            'prtVer': '1',
            'os': config.agent,
            'lang': config.language,
            'duuid': credential.deviceUUID,
            'oauthToken': credential.accessToken,
            'dtype': config.deviceType,
            'ntype': config.netType,
            'MCCMNC': config.mccmnc,
            'revision': this._lastLoginRev,
            'rp': null,
            'chatIds': [], // Long[]
            'maxIds': [], // Long[]
            'lastTokenId': this._lastTokenId,
            'lbk': this._lastBlockTk,
            'bg': false
        };

        const loginRes = await this._session.request<LoginListRes>('LOGINLIST', req);

        // TODO: fill channels
        return { status: KnownDataStatusCode.SUCCESS, success: true, result: [] };
    }
    
}