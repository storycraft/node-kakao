/*
 * Created on Thu Jan 21 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

// TODO: Move to struct modules.
// Generated using http://json2ts.com/

export interface ChatMeta {
    type: number;
    revision: number;
    authorId: number;
    content: string;
    updatedAt: number;
}

export interface DisplayMember {
    userId: number;
    nickName: string;
    countryIso: string;
    profileImageUrl?: any;
}

export interface ChatInfo {
    chatId: number;
    type: string;
    activeMembersCount: number;
    newMessageCount: number;
    invalidNewMessageCount: boolean;
    lastUpdatedAt?: any;
    lastMessage?: any;
    lastLogId: number;
    lastSeenLogId: number;
    lastChatLog?: any;
    meta?: any;
    chatMetas: ChatMeta[];
    displayMembers: DisplayMember[];
    pushAlert: boolean;
    joinedAtForNewMem: number;
    left: boolean;
}

export interface ChatInfoRes {
    chatInfo: ChatInfo;
}