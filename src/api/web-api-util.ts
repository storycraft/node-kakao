/*
 * Created on Sun Oct 13 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export function getUploadedFileKey(uploadPath: string) {
    return uploadPath.replace(/\/talk(m|p|gp|v|a)/, '');
}

export function getEmoticonHeader(screenWidth: number = 1080, screenHeight: number = 1920) {
    return {
        'RESOLUTION': `${screenWidth}x${screenHeight}`,
    };
}

export function getEmoticonURL(lang: string = 'kr') {
    return `http://item-${lang}.talk.kakao.co.kr/dw`;
}

export function getEmoticonImageURL(path: string, lang: string = 'kr') {
    return `${getEmoticonURL(lang)}/${path}`;
}

export function getEmoticonTitleURL(id: string, type: string = 'png', lang: string = 'kr') {
    return `${getEmoticonURL(lang)}/${id}.title.${type}`;
}

export function getEmoticonPackURL(id: string, lang: string = 'kr') {
    return `${getEmoticonURL(lang)}/${id}.file_pack.zip`;
}

export function getEmoticonThumbnailPackURL(id: string, lang: string = 'kr') {
    return `${getEmoticonURL(lang)}/${id}.thum_pack.zip`;
}