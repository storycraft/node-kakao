/*
 * Created on Thu Feb 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export function getEmoticonHeader(screenWidth = 1080, screenHeight = 1920): { RESOLUTION: string } {
  return {
    RESOLUTION: `${screenWidth}x${screenHeight}`,
  };
}

export function getEmoticonURL(lang = 'kr'): string {
  return `http://item-${lang}.talk.kakao.co.kr/dw`;
}

export function getEmoticonImageURL(path: string, lang = 'kr'): string {
  return `${getEmoticonURL(lang)}/${path}`;
}

export function getEmoticonTitleURL(id: string, type = 'png', lang = 'kr'): string {
  return `${getEmoticonURL(lang)}/${id}.title.${type}`;
}

export function getEmoticonPackURL(id: string, lang = 'kr'): string {
  return `${getEmoticonURL(lang)}/${id}.file_pack.zip`;
}

export function getEmoticonThumbnailPackURL(id: string, lang = 'kr'): string {
  return `${getEmoticonURL(lang)}/${id}.thum_pack.zip`;
}