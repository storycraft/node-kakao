/*
 * Created on Tue Jun 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as crypto from "crypto";
import { LoginError } from "../client";
import { DefaultConfiguration } from "../config/client-config";
import { ClientConfigProvider } from "../config/client-config-provider";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { LessSettingsStruct, MoreSettingsStruct } from "../talk/struct/api/account/client-settings-struct";
import { LoginTokenStruct } from "../talk/struct/api/account/login-token-struct";
import { AuthApiStruct } from "../talk/struct/auth/auth-api-struct";
import { LoginAccessDataStruct } from "../talk/struct/auth/login-access-data-struct";
import { WebApiStatusCode } from "../talk/struct/web-api-struct";
import { AHeaderDecorator } from "./api-header-decorator";
import { RequestHeader, WebApiClient } from "./web-api-client";

export type LoginForm = {

    email: string,
    password: string,

    device_uuid: string,

    os_version: string,

    device_name: string,

    permanent?: boolean,

    forced?: boolean,

    autowithlock?: boolean,
    auto_login?: boolean,

    passcode?: string;

}

export class AuthClient extends WebApiClient implements AccessDataProvider {

    private name: string;

    private deviceUUID: string;

    private currentLogin: (() => Promise<void>) | null;

    private accessData: LoginAccessDataStruct | null;

    private aHeader: AHeaderDecorator;

    constructor(name: string, deviceUUID: string, configProvider: ClientConfigProvider) {
        super(configProvider);

        this.aHeader = new AHeaderDecorator(configProvider);

        this.name = name;
        this.deviceUUID = deviceUUID;

        this.currentLogin = null;
        this.accessData = null;
    }

    get AHeader() {
        return this.aHeader;
    }

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'katalk.kakao.com';
    }

    get Agent() {
        return this.ConfigProvider.Configuration.agent;
    }

    fillHeader(header: RequestHeader) {
        super.fillHeader(header);

        this.aHeader.fillHeader(header);
        
        if (this.accessData) this.fillSessionHeader(header);
    }

    get Name() {
        return this.name;
    }

    get DeviceUUID() {
        return this.deviceUUID;
    }

    set DeviceUUID(uuid) {
        this.deviceUUID = uuid;
    }

    get Logon() {
        return this.accessData !== null;
    }

    async requestMoreSettings(since: number = 0, language: string = this.ConfigProvider.Configuration.language): Promise<MoreSettingsStruct> {
        return this.request('GET', `${AuthClient.getAccountApiPath(this.Agent, 'more_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(language)}`);
    }

    async requestLessSettings(since: number = 0, language: string = this.ConfigProvider.Configuration.language): Promise<LessSettingsStruct> {
        return this.request('GET', `${AuthClient.getAccountApiPath(this.Agent, 'less_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(language)}`);
    }

    async updateSettings(settings: Partial<unknown>): Promise<AuthApiStruct> {
        return this.request('POST', AuthClient.getAccountApiPath(this.Agent, 'update_settings.json'), settings);
    }

    async requestWebLoginToken(): Promise<LoginTokenStruct> {
        return this.request('GET', AuthClient.getAccountApiPath(this.Agent, 'login_token.json'));
    }

    createSessionURL(token: string, redirectURL: string) {
        return `https://accounts.kakao.com/weblogin/login_redirect?continue=${encodeURIComponent(redirectURL)}&token=${token}`;
    }

    async requestSessionURL(redirectURL: string): Promise<string> {
        let res = await this.requestWebLoginToken();

        if (res.status !== WebApiStatusCode.SUCCESS) throw new Error('Cannot request login token');

        return this.createSessionURL(res.token, redirectURL);
    }

    protected createLoginForm(email: string, password: string, permanent?: boolean, forced?: boolean): LoginForm {
        let form: LoginForm = {
            'email': email,
            'password': password,
            'device_uuid': this.deviceUUID,
            'os_version': this.ConfigProvider.Configuration.osVersion,
            'device_name': this.name
        };

        if (typeof(permanent) === 'boolean') form['permanent'] = permanent;
        if (typeof(forced) === 'boolean') form['forced'] = forced;

        return form;
    }

    protected createAutologinForm(email: string, token: string, locked: boolean, permanent?: boolean, forced?: boolean): LoginForm {
        let form = this.createLoginForm(email, token, permanent, forced);

        form['auto_login'] = true;
        form['autowithlock'] = locked;

        return form;
    }

    protected createRegisterForm(passcode: string, email: string, password: string, permanent: boolean, forced?: boolean): LoginForm {
        let form = this.createLoginForm(email, password, permanent, forced);

        form['passcode'] = passcode;

        return form;
    }

    async login(email: string, password: string, forced: boolean = false) {
        this.accessData = null;
        this.currentLogin = this.login.bind(this, email, password, forced);

        let form = this.createLoginForm(email, password, undefined, forced);

        let xvc = this.calculateXVCKey(this.BasicHeader.UserAgent, email);
        this.loginAccessData(await this.requestMapped<LoginAccessDataStruct>('POST', AuthClient.getAccountApiPath(this.Agent, 'login.json'), LoginAccessDataStruct.MAPPER, form, { 'X-VC': xvc }));
    }

    async loginToken(email: string, token: string, forced: boolean = false, locked: boolean = true) {
        this.accessData = null;
        this.currentLogin = this.loginToken.bind(this, email, token, forced);

        let form = this.createAutologinForm(email, token, locked, undefined, forced);

        let xvc = this.calculateXVCKey(this.BasicHeader.UserAgent, email);
        this.loginAccessData(await this.requestMapped<LoginAccessDataStruct>('POST', AuthClient.getAccountApiPath(this.Agent, 'login.json'), LoginAccessDataStruct.MAPPER, form, { 'X-VC': xvc }));
    }

    protected loginAccessData(accessData: LoginAccessDataStruct) {
        if (accessData.status !== WebApiStatusCode.SUCCESS) {
            throw accessData as LoginError;
        }

        this.accessData = accessData;
    }

    async requestPasscode(email: string, password: string, forced: boolean = false): Promise<AuthApiStruct> {
        let form = this.createLoginForm(email, password, undefined, forced);

        let xvc = this.calculateXVCKey(this.BasicHeader.UserAgent, email);
        return this.request('POST', AuthClient.getAccountApiPath(this.Agent, 'request_passcode.json'), form, { 'X-VC': xvc });
    }

    async registerDevice(passcode: string, email: string, password: string, permanent: boolean, forced: boolean = false): Promise<AuthApiStruct> {
        let form = this.createRegisterForm(passcode, email, password, permanent, forced);

        let xvc = this.calculateXVCKey(this.BasicHeader.UserAgent, email);
        return this.request('POST', AuthClient.getAccountApiPath(this.Agent, 'register_device.json'), form, { 'X-VC': xvc });
    }

    async relogin() {
        if (!this.currentLogin) throw new Error('Login data does not exist');

        return this.currentLogin();
    }

    static getAccountApiPath(agent: string, api: string) {
        return `${agent}/account/${api}`;
    }

    calculateXVCKey(userAgent: string, email: string): string {
        return this.calculateFullXVCKey(userAgent, email).substring(0, 16);
    }

    calculateFullXVCKey(userAgent: string, email: string): string {
        let config = this.ConfigProvider.Configuration;

        let source = `${config.xvcSeedList[0]}|${userAgent}|${config.xvcSeedList[1]}|${email}|${this.deviceUUID}`;

        let hash = crypto.createHash('sha512');
        hash.update(source);
        return hash.digest('hex');
    }
	
	generateAutoLoginToken(): string {
        let accessData = this.getLatestAccessData();
        let config = this.ConfigProvider.Configuration;
	    let source = `${config.loginTokenSeedList[0]}|${accessData.autoLoginEmail}|${accessData.refreshToken}|${this.deviceUUID}|${config.loginTokenSeedList[1]}`;

        let hash = crypto.createHash('sha512');
        hash.update(source);
        return hash.digest('hex');
	}

    logout() {
        this.currentLogin = null;
        this.accessData = null;
    }

    getLatestAccessData(): LoginAccessDataStruct {
        if (!this.accessData) throw new Error('Not logon');

        return this.accessData;
    }

    fillSessionHeader(header: RequestHeader) {
        header['Authorization'] = `${this.getLatestAccessData().accessToken}-${this.deviceUUID}`;
    }

}