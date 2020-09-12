/*
 * Created on Sun Jul 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiClient } from "./web-api-client";
import { OpenUploadKeyStruct } from "../talk/struct/api/open/open-upload-key-struct";

export class OpenUploadApi extends WebApiClient {

    get Scheme() {
        return 'https';
    }

    get Host() {
        return 'up-api1-kage.kakao.com';
    }

    async uploadLinkImage(name: string, file: Buffer, contentType: string = 'image/jpeg'): Promise<OpenUploadKeyStruct> {
        return this.requestMultipart<OpenUploadKeyStruct>('POST', 'up/open-chat-profile/', { 'file_1': { value: file, options: { filename: name, contentType: contentType } } });
    }

    async uploadLinkPostImage(name: string, file: Buffer, contentType: string = 'image/jpeg'): Promise<OpenUploadKeyStruct> {
        return this.requestMultipart<OpenUploadKeyStruct>('POST', 'up/open-chat-profile-post/', { 'file_1': { value: file, options: { filename: name, contentType: contentType } } });
    }

    getOriginalLinkImageURL(accessKey: string) {
        return `http://open.kakaocdn.net/dn/${accessKey}/img.jpg`;
    }

    getSmallLinkImageURL(accessKey: string) {
        return `http://open.kakaocdn.net/dn/${accessKey}/img_s.jpg`;
    }

    getLargeLinkImageURL(accessKey: string) {
        return `http://open.kakaocdn.net/dn/${accessKey}/img_l.jpg`;
    }

}