import Axios from "axios";
import * as FormData from "form-data";
import { AHeaderDecorator } from "./api/api-header-decorator";

/*
 * Created on Sun Oct 13 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

// Deprecated and won't show on production
export class KakaoAPI {

    static get InternalProtocol() {
        return 'https';
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
        let formData = new FormData();

        formData.append('user_id', userId.toString());
        formData.append('photo', img, { filename: name });

        let res = await Axios.request({
            url: KakaoAPI.ProfileUploadURL,
            method: 'POST',
            data: formData,
            responseType: 'text'
        });

        return res.data;
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
        let formData = new FormData();

        formData.append('user_id', userId.toString());
        formData.append('attachment_type', type);
        formData.append('attachment', attachment, { filename: name });

        let headers = {};
        AHeaderDecorator.INSTANCE.fillHeader(headers);
        
        let req = Axios.request({
            url: KakaoAPI.getUploadURL(type),
            method: 'POST',
            headers: headers,
            data: formData,
            responseType: 'json'
        });

        let res = await req;

        let data = await res.data as any;

        try {
            return data['path']; //For some types
        } catch (e) {
            return '';
        }
    }

    static getUploadedFile(uploadPath: string, type: KakaoAPI.AttachmentType): string {
        return `${this.getAttachmentURL(type)}${uploadPath}`;
    }

    static getUploadedFileKey(uploadPath: string) {
        return uploadPath.replace(/\/talk(m|p|gp|v|a)/, '');
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
        return Axios.get(KakaoAPI.getEmoticonImageURL(path, lang), {
            headers: KakaoAPI.getEmoticonHeader(),
        });
    }

    static getEmoticonPack(id: string, lang: string = 'kr') {
        return Axios.get(KakaoAPI.getEmoticonPackURL(id, lang), {
            headers: KakaoAPI.getEmoticonHeader()
        });
    }

    static getEmoticonThumbnailPack(id: string, lang: string = 'kr') {
        return Axios.get(KakaoAPI.getEmoticonThumbnailPackURL(id, lang), {
            headers: KakaoAPI.getEmoticonHeader()
        });
    }

}


export namespace KakaoAPI {

    export enum AttachmentType {
        
        IMAGE = 'image/jpeg',
        AUDIO = 'audio/mp4',
        VIDEO = 'video/mp4',
        FILE = 'image/jpeg'//'application/*' //THIS DOESNT WORK WTF WHY

    }
    
}
