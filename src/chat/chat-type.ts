/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/**
 * Known chat type.
 */
export enum KnownChatType {

  FEED = 0,
  TEXT = 1,
  PHOTO = 2,
  VIDEO = 3,
  CONTACT = 4,
  AUDIO = 5,
  DITEMEMOTICON = 6,
  DITEMGIFT = 7,
  DITEMIMG = 8,
  KAKAOLINKV1 = 9,
  AVATAR = 11,
  STICKER = 12,
  SCHEDULE = 13,
  VOTE = 14,
  LOTTERY = 15,
  MAP = 16,
  PROFILE = 17,
  FILE = 18,
  STICKERANI = 20,
  NUDGE = 21,
  ACTIONCON = 22,
  SEARCH = 23,
  POST = 24,
  STICKERGIF = 25,
  REPLY = 26,
  MULTIPHOTO = 27,
  VOIP = 51,
  LIVETALK = 52,
  CUSTOM = 71,
  ALIM = 72,
  PLUSFRIEND = 81,
  PLUSEVENT = 82,
  PLUSFRIENDVIRAL = 83,
  OPEN_SCHEDULE = 96,
  OPEN_VOTE = 97,
  OPEN_POST = 98,

}

export type ChatType = KnownChatType | number;

export const DELETED_MESSAGE_OFFSET = 16384;

export function isDeletedChat(type: ChatType): boolean {
  return type >= DELETED_MESSAGE_OFFSET;
}

export function getOriginalType(type: ChatType): ChatType {
  return type & 0xffffbfff;
}
