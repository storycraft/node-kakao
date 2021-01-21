/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";

// TODO: Move to struct modules.
// Generated using http://json2ts.com/

export interface Chatlog {
    logId: any;
    chatId: any;
    type: number;
    authorId: any;
    message: string;
    sendAt: number;
    attachment: string;
    msgId: number;
    prevId: any;
    supplement: string;
}

export interface ChatData {
    c: Long;
    t: string;
    a: number;
    n: number;
    s: any;
    l: Chatlog;
    i: any[];
    k: string[];
    m?: any;
    mmr: any;
    ll: any;
    o: number;
    jn: number;
    p: boolean;
    li?: Long;
    otk?: number;
}

export interface LoginListRes {
    chatDatas: ChatData[];
    lastChatId: Long;
    lastTokenId: Long;
    mcmRevision: number;
    delChatIds: number[];
    kc: any[];
    ltk: Long;
    lbk: number;
    eof: boolean;
    userId: Long;
    revision: number;
    revisionInfo: string;
    minLogId: number;
    sb: number;
}