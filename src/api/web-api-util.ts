/*
 * Created on Sun Oct 13 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export function getUploadedFileKey(uploadPath: string) {
  return uploadPath.replace(/\/talk(m|p|gp|v|a)/, '');
}

export function getEmoticonHeader(screenWidth = 1080, screenHeight = 1920) {
  return {
    'RESOLUTION': `${screenWidth}x${screenHeight}`,
  };
}

export function getEmoticonURL(lang = 'kr') {
  return `http://item-${lang}.talk.kakao.co.kr/dw`;
}

export function getEmoticonImageURL(path: string, lang = 'kr') {
  return `${getEmoticonURL(lang)}/${path}`;
}

export function getEmoticonTitleURL(id: string, type = 'png', lang = 'kr') {
  return `${getEmoticonURL(lang)}/${id}.title.${type}`;
}

export function getEmoticonPackURL(id: string, lang = 'kr') {
  return `${getEmoticonURL(lang)}/${id}.file_pack.zip`;
}

export function getEmoticonThumbnailPackURL(id: string, lang = 'kr') {
  return `${getEmoticonURL(lang)}/${id}.thum_pack.zip`;
}
