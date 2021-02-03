/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChatlogStruct } from '../struct';

// TODO: Move to struct modules.
// Generated using http://json2ts.com/

export interface ChannelDataStruct {
    c: Long;
    t: string;
    a: number;
    n: number;
    s: any;
    l: ChatlogStruct;
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
    chatDatas: ChannelDataStruct[];
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
