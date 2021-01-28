/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { ApiClient, createApiClient, RequestForm, RequestHeader } from ".";
import { DefaultConfiguration, OAuthLoginConfig } from "../config";
import { OAuthCredential } from "../oauth";
import { AsyncCommandResult, DefaultRes, KnownDataStatusCode } from "../request";
import { fillAHeader, fillBaseHeader, getWinAgent } from "./header-util";
import { AccessDataStruct, structToLoginData } from "./struct";
import * as ShaJS from "sha.js";

/**
 * Login data
 */
export interface LoginData extends OAuthCredential {

    /**
     * User id
     */
    userId: number | Long;

    /**
     * Country iso
     */
    countryIso: string;

    /**
     * Country code
     */
    countryCode: string;

    /**
     * Account id
     */
    accountId: number;

    /**
     * Login server time
     */
    serverTime: number;

    /**
     * true if user data should be reset
     */
    resetUserData: boolean;

    /**
     * Story URL
     */
    storyURL: string;

    /**
     * OAuth token type
     */
    tokenType: string;

    /**
     * Auto login account id
     */
    autoLoginAccountId: string;

    /**
     * Displayed account id
     */
    displayAccountId: string;

    /**
     * Main device agent
     */
    mainDeviceAgentName: string;

    /**
     * Main device app version
     */
    mainDeviceAppVersion: string;
}

export interface LoginForm {

    email: string;
    password: string;

    forced?: boolean;

}

export interface TokenLoginForm extends LoginForm {

    autowithlock: boolean;

}

/**
 * Provides default pc login api which can obtain OAuthCredential
 */
export class AuthClient {

    constructor(private _client: ApiClient, private _name: string, private _deviceUUID: string, public config: OAuthLoginConfig) {

    }

    get name() {
        return this._name;
    }

    get deviceUUID() {
        return this._deviceUUID;
    }

    private createAuthHeader(form: LoginForm): RequestHeader {
        const header: RequestHeader = {};

        fillBaseHeader(header, this.config);
        fillAHeader(header, this.config);
        const userAgent = getWinAgent(this.config);
        header['User-Agent'] = userAgent;
        header['X-VC'] = this.calculateXVCKey(this.deviceUUID, userAgent, form.email);

        return header;
    }

    private fillAuthForm(form: RequestForm): RequestForm {
        form['device_uuid'] = this._deviceUUID;
        form['device_name'] = this._name;

        return form;
    }

    /**
     * Login using given data.
     *
     * @param form
     */
    async login(form: LoginForm): AsyncCommandResult<LoginData> {
        const res = await this._client.request(
            'POST',
            this.getApiPath('login.json'),
            this.fillAuthForm(form),
            this.createAuthHeader(form)
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: structToLoginData(res as DefaultRes & AccessDataStruct, this._deviceUUID) };
    }

    /**
     * Login using token.
     *
     * @param form
     */
    async loginToken(form: TokenLoginForm): AsyncCommandResult<LoginData> {
        const res = await this._client.request(
            'POST',
            this.getApiPath('login.json'),
            this.fillAuthForm({ ...form, auto_login: true }),
            this.createAuthHeader(form)
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: structToLoginData(res as DefaultRes & AccessDataStruct, this._deviceUUID) };
    }

    /**
     * Request passcode
     *
     * @param form
     * @param permanent If true the device will be registered as permanent
     */
    async requestPasscode(form: LoginForm, permanent: boolean = true): AsyncCommandResult {
        const res = await this._client.request(
            'POST',
            this.getApiPath('request_passcode.json'),
            this.fillAuthForm({ ...form, permanent }),
            this.createAuthHeader(form)
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    /**
     * Try to register device with passcode
     *
     * @param form
     * @param passcode
     */
    async registerDevice(form: LoginForm, passcode: string): AsyncCommandResult {
        const res = await this._client.request(
            'POST',
            this.getApiPath('register_device.json'),
            this.fillAuthForm({ ...form, passcode }),
            this.createAuthHeader(form)
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    calculateXVCKey(deviceUUID: string, userAgent: string, email: string): string {
        return this.calculateFullXVCKey(deviceUUID, userAgent, email).substring(0, 16);
    }

    calculateFullXVCKey(deviceUUID: string, userAgent: string, email: string): string {
        let source = `${this.config.xvcSeedList[0]}|${userAgent}|${this.config.xvcSeedList[1]}|${email}|${deviceUUID}`;

        // TODO
        let hash = new ShaJS.sha512();

        hash.update(source);

        return hash.digest('hex');
    }

    private getApiPath(api: string) {
        return `${this.config.agent}/account/${api}`;
    }

    /**
     * Create default AuthClient using config.
     *
     * @param config
     */
    static async create(name: string, deviceUUID: string, config: Partial<OAuthLoginConfig> = {}): Promise<AuthClient> {
        return new AuthClient(
            await createApiClient('https', 'katalk.kakao.com'),
            name,
            deviceUUID,
            Object.assign(config, DefaultConfiguration)
        );
    }

}