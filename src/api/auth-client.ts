/*
 * Created on Tue Jun 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LoginAccessDataStruct } from "../talk/struct/auth/login-access-data-struct";
import { LoginError } from "../client";
import * as crypto from "crypto";
import { DefaultConfiguration } from "../config/client-config";
import { AccessDataProvider } from "../oauth/access-data-provider";
import { RequestHeader, WebApiClient } from "./web-api-client";
import { AHeaderDecorator, BasicHeaderDecorator } from "./api-header-decorator";
import { WebApiStatusCode } from "../talk/struct/web-api-struct";
import { AuthApiStruct } from "../talk/struct/auth/auth-api-struct";
import { MoreSettingsStruct, LessSettingsStruct } from "../talk/struct/api/account/client-settings-struct";
import { LoginTokenStruct } from "../talk/struct/api/account/login-token-struct";

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

    constructor(name: string, deviceUUID: string) {
        super();

        this.name = name;
        this.deviceUUID = deviceUUID;

        this.currentLogin = null;
        this.accessData = null;
    }

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'ac-sb-talk.kakao.com';
    }

    fillHeader(header: RequestHeader) {
        super.fillHeader(header);

        AHeaderDecorator.INSTANCE.fillHeader(header);
        
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
        return this.currentLogin !== null;
    }

    async requestMoreSettings(since: number = 0, language: string = DefaultConfiguration.language): Promise<MoreSettingsStruct> {
        return this.request('GET', `${AuthClient.getAccountApiPath('more_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(language)}`);
    }

    async requestLessSettings(since: number = 0, language: string = DefaultConfiguration.language): Promise<LessSettingsStruct> {
        return this.request('GET', `${AuthClient.getAccountApiPath('less_settings.json')}?since=${encodeURIComponent(since)}&lang=${encodeURIComponent(language)}`);
    }

    async updateSettings(settings: Partial<unknown>): Promise<AuthApiStruct> {
        return this.request('POST', AuthClient.getAccountApiPath('update_settings.json'), settings);
    }

    async requestWebLoginToken(): Promise<LoginTokenStruct> {
        return this.request('GET', AuthClient.getAccountApiPath('login_token.json'));
    }

    protected createLoginForm(email: string, password: string, permanent?: boolean, forced?: boolean): LoginForm {
        let form: LoginForm = {
            'email': email,
            'password': password,
            'device_uuid': this.deviceUUID,
            'os_version': DefaultConfiguration.osVersion,
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

        let xvc = this.calculateXVCKey(BasicHeaderDecorator.INSTANCE.UserAgent, email);
        this.loginAccessData(await this.requestMapped<LoginAccessDataStruct>('POST', AuthClient.getAccountApiPath('login.json'), LoginAccessDataStruct.MAPPER, form, { 'X-VC': xvc }));
    }

    async loginToken(email: string, token: string, forced: boolean = false, locked: boolean = true) {
        this.accessData = null;
        this.currentLogin = this.loginToken.bind(this, email, token, forced);

        let form = this.createAutologinForm(email, token, locked, undefined, forced);

        let xvc = this.calculateXVCKey(BasicHeaderDecorator.INSTANCE.UserAgent, email);
        this.loginAccessData(await this.requestMapped<LoginAccessDataStruct>('POST', AuthClient.getAccountApiPath('login.json'), LoginAccessDataStruct.MAPPER, form, { 'X-VC': xvc }));
    }

    protected loginAccessData(accessData: LoginAccessDataStruct) {
        this.accessData = accessData;

        if (this.accessData.status !== WebApiStatusCode.SUCCESS) {
            throw accessData as LoginError;
        }
    }

    async requestPasscode(email: string, password: string, forced: boolean = false): Promise<AuthApiStruct> {
        let form = this.createLoginForm(email, password, undefined, forced);

        let xvc = this.calculateXVCKey(BasicHeaderDecorator.INSTANCE.UserAgent, email);
        return this.request('POST', AuthClient.getAccountApiPath('request_passcode.json'), form, { 'X-VC': xvc });
    }

    async registerDevice(passcode: string, email: string, password: string, permanent: boolean, forced: boolean = false): Promise<AuthApiStruct> {
        let form = this.createRegisterForm(passcode, email, password, permanent, forced);

        let xvc = this.calculateXVCKey(BasicHeaderDecorator.INSTANCE.UserAgent, email);
        return this.request('POST', AuthClient.getAccountApiPath('register_device.json'), form, { 'X-VC': xvc });
    }

    async relogin() {
        if (!this.currentLogin) throw new Error('Login data does not exist');

        return this.currentLogin();
    }

    static getAccountApiPath(api: string) {
        return `${DefaultConfiguration.agent}/account/${api}`;
    }

    calculateXVCKey(userAgent: string, email: string): string {
        return this.calculateFullXVCKey(userAgent, email).substring(0, 16);
    }

    calculateFullXVCKey(userAgent: string, email: string): string {
        let res = `HEATH|${userAgent}|DEMIAN|${email}|${this.deviceUUID}`;

        let hash = crypto.createHash('sha512');

        hash.update(res);

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