import * as request from "request-promise";
import * as querystring from "querystring";
import { Stream } from "stream";
import { strict } from "assert";
import * as Crypto from "crypto";

/*
 * Created on Sun Oct 13 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class KakaoAPI {

    static get LocoPEMPublicKey() {
        return `-----BEGIN PUBLIC KEY-----\nMIIBIDANBgkqhkiG9w0BAQEFAAOCAQ0AMIIBCAKCAQEApElgRBx+g7sniYFW7LE8ivrwXShKTRFV8lXNItMXbN5QSC8vJ/cTSOTS619Xv5Zx7xXJIk4EKxtWesEGbgZpEUP2xQ+IeH9oz0JxayEMvvD1nVNAWgpWE4pociEoArsK7qY3YwXb1CiDHo9hojLv7djbo3cwXvlyMh4TUrX2RjCZPlVJxk/LVjzcl9ohJLkl3eoSrf0AE4kQ9mk3+raEhq5Dv+IDxKYX+fIytUWKmrQJusjtre9oVUX5sBOYZ0dzez/XapusEhUWImmB6mciVXfRXQ8IK4IH6vfNyxMSOTfLEhRYN2SMLzplAYFiMV536tLS3VmG5GJRdkpDubqPeQIBAw==\n-----END PUBLIC KEY-----`;
    }

    static get LocoPublicKey() {
        return {
            n: Buffer.from('a44960441c7e83bb27898156ecb13c8afaf05d284a4d1155f255cd22d3176cde50482f2f27f71348e4d2eb5f57bf9671ef15c9224e042b1b567ac1066e06691143f6c50f88787f68cf42716b210cbef0f59d53405a0a56138a6872212802bb0aeea6376305dbd428831e8f61a232efedd8dba377305ef972321e1352b5f64630993e5549c64fcb563cdc97da2124b925ddea12adfd00138910f66937fab68486ae43bfe203c4a617f9f232b5458a9ab409bac8edadef685545f9b013986747737b3fd76a9bac121516226981ea67225577d15d0f082b8207eaf7cdcb13123937cb12145837648c2f3a65018162315e77ead2d2dd5986e46251764a43b9ba8f79', 'hex'),
            e: 0x03
        };
    }
    
    static get Agent() {
        return 'win32';
    }

    static get Version() {
        return '3.1.1';
    }

    static get InternalAppVersion() {
        return `${this.Version}.${this.InternalAppSubVersion}`;
    }

    static get InternalAppSubVersion() {
        return '2441';
    }

    static get OSVersion() {
        return '10.0';
    }

    static get Language() {
        return 'ko';
    }

    static get AuthUserAgent() {
        return `KT/${KakaoAPI.Version} Wd/${KakaoAPI.OSVersion} ${KakaoAPI.Language}`;
    }

    static get AuthHeaderAgent() {
        return `${KakaoAPI.Agent}/${KakaoAPI.Version}/${KakaoAPI.Language}`;
    }

    static get InternalProtocol() {
        return 'https';
    }

    static get AccountInternalHost() {
        return 'ac-sb-talk.kakao.com';
    }

    static get InternalHost() {
        return 'sb-talk.kakao.com';
    }

    static get LocoEntry() {
        return 'booking-loco.kakao.com';
    }



    static get ProfileUploadHost() {
        return `up-p.talk.kakao.com`;
    }

    static get MediaUploadHost() {
        return `up-m.talk.kakao.com`;
    }

    static get VideoUploadHost() {
        return `up-v.talk.kakao.com`;
    }

    static get AudioUploadHost() {
        return `up-a.talk.kakao.com`;
    }

    static get GroupProfileUploadHost() {
        return `up-gp.talk.kakao.com`;
    }

    static get FileHost() {
        return 'dn.talk.kakao.com';
    }

    static get MediaFileHost() {
        return 'dn-m.talk.kakao.com';
    }

    static get AudioFileHost() {
        return 'dn-a.talk.kakao.com';
    }

    static get VideoFileHost() {
        return 'dn-v.talk.kakao.com';
    }

    static get MediaFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.MediaFileHost}`;
    }

    static get ProfileFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.MediaFileHost}`;
    }

    static get GroupProfileFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.MediaFileHost}`;
    }

    static get VideoFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.VideoFileHost}`;
    }

    static get AudioFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.AudioFileHost}`;
    }

    static get FileFileURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.FileHost}`;
    }

    static get MediaUploadURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.MediaUploadHost}/upload`;
    }

    static get ProfileUploadURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.ProfileUploadHost}/upload`;
    }

    static get GroupProfileUploadURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.GroupProfileUploadHost}/upload`;
    }

    static get VideoUploadURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.VideoUploadHost}/upload`;
    }

    static get AudioUploadURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.AudioUploadHost}/upload`;
    }


    
    // This will return path. Use getUploadedFile to get Full URL
    static async uploadProfile(img: Buffer, name: string, userId: number = -1): Promise<string> {
        let data: any = {
            'user_id': userId,
            'photo': {
                value: img,
                options: {
                    'filename': name
                }
            }
        };

        let value = await request(KakaoAPI.ProfileUploadURL, {
            method: 'POST',
            formData: data
        });

        return value as string;
    }

    static getUploadURL(type: KakaoAPI.AttachmentType) {
        switch (type) {

            case this.AttachmentType.IMAGE:
                return KakaoAPI.MediaUploadURL

            case this.AttachmentType.AUDIO:
                return KakaoAPI.AudioUploadURL

            case this.AttachmentType.VIDEO:
                return KakaoAPI.VideoUploadURL

            default:
                return KakaoAPI.MediaUploadURL;
        }
    }

    static getAttachmentURL(type: KakaoAPI.AttachmentType) {
        switch (type) {

            case this.AttachmentType.IMAGE:
                return KakaoAPI.MediaFileURL

            case this.AttachmentType.AUDIO:
                return KakaoAPI.AudioFileURL

            case this.AttachmentType.VIDEO:
                return KakaoAPI.VideoFileURL

            case this.AttachmentType.FILE:
                return KakaoAPI.MediaFileURL

            default:
                return KakaoAPI.MediaFileURL;
        }
    }

    static async uploadAttachment(type: KakaoAPI.AttachmentType, attachment: Buffer, name: string, userId: number = -1): Promise<string> {
        let req = request(KakaoAPI.getUploadURL(type), {
            method: 'POST',
            headers: {
                'A': KakaoAPI.AuthHeaderAgent
            },
            formData: {
                'user_id': userId,
                'attachment_type': type,
                'attachment': {
                    value: attachment,
                    options: {
                        'filename': name,
                        'contentType': null
                    }
                }
            }
        });

        let str: string = await req;

        try {
            return JSON.parse(str)['path']; //For some types
        } catch (e) {
            return str;
        }
    }

    static getUploadedFile(uploadPath: string, type: KakaoAPI.AttachmentType): string {
        return `${this.getAttachmentURL(type)}${uploadPath}`;
    }

    static getUploadedFileKey(uploadPath: string) {
        return uploadPath.replace(/\/talk(m|p|gp|v|a)/, '');
    }

    static get LocoEntryPort() {
        return 443;
    }

    static get AccountInternalURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.AccountInternalHost}`;
    }

    static get InternalURL() {
        return `${KakaoAPI.InternalProtocol}://${KakaoAPI.InternalHost}`;
    }

    static get AccountPath() {
        return 'account';
    }



    static getInternalURL(type: KakaoAPI.LogonAccount) {
        return `${KakaoAPI.InternalURL}/${KakaoAPI.Agent}/${KakaoAPI.AccountPath}/${type}`;
    }

    static getAccountInternalURL(type: KakaoAPI.Account) {
        return `${KakaoAPI.AccountInternalURL}/${KakaoAPI.Agent}/${KakaoAPI.AccountPath}/${type}`;
    }



    static getEmoticonHeader(screenWidth: number = 1080, screenHeight: number = 1920) {
        return {
            'RESOLUTION': `${screenWidth}x${screenHeight}`,
        };
    }

    static getEmoticonURL(lang: string = 'kr') {
        return `http://item-${lang}.talk.kakao.co.kr/dw`;
    }

    static getEmoticonImageURL(path: string, lang: string = 'kr') {
        return `${KakaoAPI.getEmoticonURL(lang)}/${path}`;
    }

    static getEmoticonTitleURL(id: string, type: string = 'png', lang: string = 'kr') {
        return `${KakaoAPI.getEmoticonURL(lang)}/${id}.title.${type}`;
    }

    static getEmoticonPackURL(id: string, lang: string = 'kr') {
        return `${KakaoAPI.getEmoticonURL(lang)}/${id}.file_pack.zip`;
    }

    static getEmoticonThumbnailPackURL(id: string, lang: string = 'kr') {
        return `${KakaoAPI.getEmoticonURL(lang)}/${id}.thum_pack.zip`;
    }


    static getEmoticonImage(path: string, lang: string = 'kr') {
        return request({
            url: KakaoAPI.getEmoticonImageURL(path, lang),
            headers: KakaoAPI.getEmoticonHeader(),
            method: 'GET'
        });
    }

    static getEmoticonPack(id: string, lang: string = 'kr') {
        return request({
            url: KakaoAPI.getEmoticonPackURL(id, lang),
            headers: KakaoAPI.getEmoticonHeader(),
            method: 'GET'
        });
    }

    static getEmoticonThumbnailPack(id: string, lang: string = 'kr') {
        return request({
            url: KakaoAPI.getEmoticonThumbnailPackURL(id, lang),
            headers: KakaoAPI.getEmoticonHeader(),
            method: 'GET'
        });
    }



    static getAuthHeader(verifyCodeExtra: string, contentLength: number) {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': contentLength,
            'Host': KakaoAPI.AccountInternalHost,
            'A': KakaoAPI.AuthHeaderAgent,
            'X-VC': verifyCodeExtra,
            'User-Agent': KakaoAPI.AuthUserAgent,
            'Accept': '*/*',
            'Accept-Language': KakaoAPI.Language
        };
    }

    static getSessionHeader(accessToken: string, deviceUUID: string) {
        return {
            'Host': KakaoAPI.InternalHost,
            'Authorization': `${accessToken}-${deviceUUID}`,
            'A': KakaoAPI.AuthHeaderAgent,
            'User-Agent': KakaoAPI.AuthUserAgent,
            'Accept': '*/*',
            'Accept-Language': KakaoAPI.Language
        };
    }

    static getLoginData(email: string, password: string, deviceUUID: string, deviceName: string, permanent = true, osVersion: string = KakaoAPI.OSVersion, forced: boolean = false) {
        return {
            'email': email,
            'password': password,
            'device_uuid': deviceUUID,
            'os_version': osVersion,
            'device_name': deviceName,
            'permanent': permanent,
            'forced': forced
        }
    }

    static getDeviceRegisterData(email: string, password: string, deviceUUID: string, deviceName: string, passcode: string, permanent = true, osVersion: string = KakaoAPI.OSVersion) {
        return {
            'email': email,
            'password': password,
            'device_uuid': deviceUUID,
            'os_version': osVersion,
            'device_name': deviceName,
            'permanent': permanent,
            'passcode': passcode
        }
    }
    
    static requestLogin(email: string, password: string, deviceUUID: string, deviceName: string, forced?: boolean, permanent?: boolean, osVersion?: string, verifyCodeExtra: string = this.calculateXVCKey(this.AuthUserAgent, email, deviceUUID)) {
        let loginData = KakaoAPI.getLoginData(email, password, deviceUUID, deviceName, permanent, osVersion, forced);

        let queryData = querystring.stringify(loginData);
        
        return request({
            url: KakaoAPI.getAccountInternalURL(KakaoAPI.Account.LOGIN),
            headers: KakaoAPI.getAuthHeader(verifyCodeExtra, queryData.length),
            body: queryData,
            method: 'POST'
        });
    }

    static requestPasscode(email: string, password: string, deviceUUID: string, deviceName: string, permanent?: boolean, osVersion?: string, verifyCodeExtra: string = this.calculateXVCKey(this.AuthUserAgent, email, deviceUUID)) {
        let loginData = KakaoAPI.getLoginData(email, password, deviceUUID, deviceName, permanent, osVersion);

        let queryData = querystring.stringify(loginData);
        
        return request({
            url: KakaoAPI.getAccountInternalURL(KakaoAPI.Account.REQUEST_PASSCODE),
            headers: KakaoAPI.getAuthHeader(verifyCodeExtra, queryData.length),
            body: queryData,
            method: 'POST'
        });
    }

    static registerDevice(passcode: string, email: string, password: string, deviceUUID: string, deviceName: string, permanent?: boolean, osVersion?: string, verifyCodeExtra: string = this.calculateXVCKey(this.AuthUserAgent, email, deviceUUID)) {
        let deviceRegisterData = KakaoAPI.getDeviceRegisterData(email, password, deviceUUID, deviceName, passcode, permanent, osVersion);

        let queryData = querystring.stringify(deviceRegisterData);
        
        return request({
            url: KakaoAPI.getAccountInternalURL(KakaoAPI.Account.REGISTER_DEVICE),
            headers: KakaoAPI.getAuthHeader(verifyCodeExtra, queryData.length),
            body: queryData,
            method: 'POST'
        });
    }

    static calculateXVCKey(aHeader: string, email: string, deviceUUID: string): string {
        return this.calculateFullXVCKey(aHeader, email, deviceUUID).substring(0, 16);
    }

    static calculateFullXVCKey(aHeader: string, email: string, deviceUUID: string): string {
        let res = `HEATH|${aHeader}|DEMIAN|${email}|${deviceUUID}`;

        let hash = Crypto.createHash('sha512');

        hash.update(res);

        return hash.digest('hex');
    }

    static requestAccountSettings(accessToken: string, deviceUUID: string, since: number = 0, language: string = KakaoAPI.Language) {
        return request({
            url: `${KakaoAPI.getInternalURL(KakaoAPI.LogonAccount.MORE_SETTINGS)}?since=${since}&lang=${language}`,
            headers: KakaoAPI.getSessionHeader(accessToken, deviceUUID),
            method: 'GET'
        });
    }

    static requestAutoLoginToken(accessToken: string, deviceUUID: string) {
        return request({
            url: `${KakaoAPI.getInternalURL(KakaoAPI.LogonAccount.LOGIN_TOKEN)}`,
            headers: KakaoAPI.getSessionHeader(accessToken, deviceUUID),
            method: 'GET'
        });
    }



    static createSendTextURL(message: string) {
        return `kakaotalk://leverage?action=sendtext&message=${encodeURIComponent(message)}`;
    }

    static createJoinLinkURL(code: string, ref: string = 'EW') {
        return `kakaoopen://join?l=${code}&r=${ref}`;
    }
}


export namespace KakaoAPI {

    export enum AttachmentType {
        
        IMAGE = 'image/jpeg',
        AUDIO = 'audio/mp4',
        VIDEO = 'video/mp4',
        FILE = 'image/jpeg'//'application/*' //THIS DOESNT WORK WTF WHY

    }

    export enum Account {
        LOGIN = 'login.json',
        REGISTER_DEVICE = 'register_device.json',
        REQUEST_PASSCODE = 'request_passcode.json',
        LOGIN_TOKEN = 'login_token.json',
        REQUEST_VERIFY_EMAIL = 'request_verify_email.json',
        RENEW_TOKEN = 'renew_token.json',
        CHANGE_UUID = 'change_uuid.json',
        CAN_CHANGE_UUID = 'can_change_uuid.json',
    
    }
    
    export enum LogonAccount {
        MORE_SETTINGS = 'more_settings.json',
        LESS_SETTINGS = 'less_settings.json',
        BLOCKED_LIST = 'blocked.json',
        LOGIN_TOKEN = 'login_token.json'
    }

    export enum RequestStatusCode { // Note StatusCode in loco-packet-base.ts uses almost same code. (loco packets were https requests before)

        SUCCESS = 0,
        LOGIN_FAILED = 30,
        DEVICE_NOT_REGISTERED = -100,
        ANOTHER_LOGINED = -101,
        DEVICE_REGISTER_FAILED = -102,
        PASSCODE_REQUEST_FAILED = -112,
        OPERATION_DENIED = -500,
        ACCOUNT_RESTRICTED = -997

    }

}