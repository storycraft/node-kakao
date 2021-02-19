/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';

export enum ApiUserType {

  NORMAL = 0,
  PLUS = 1

}

export interface FriendExt {

  addible: boolean;
  yellowid: boolean;
  consultable: boolean;
  friendsCount: number;
  verificationType: string;
  isAdult: boolean;
  writable: boolean;
  serviceTypeCode: number;
  isOfficial: boolean;

}

export interface FriendStruct {

  userId: Long | number;
  nickName: string;
  type: number;
  phoneNumber: string;
  statusMessage: string;
  UUID: string;
  friendNickName: string;
  phoneticName?: string;
  accountId: number;
  profileImageUrl: string;
  fullProfileImageUrl: string;
  originalProfileImageUrl: string;
  userType: ApiUserType;
  ext: FriendExt | unknown;
  hidden: boolean;
  purged: boolean;
  favorite: boolean;
  screenToken: number;
  suspended: false;
  directChatId: number;

}
