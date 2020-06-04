/*
 * Created on Thu Jun 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { KakaoAPI } from "../kakao-api";

export namespace HostData {

    export const BookingHost: HostData = {
        host: KakaoAPI.LocoEntry, 
        port: KakaoAPI.LocoEntryPort,
        keepAlive: false
    }

}

export interface HostData {
    
    host: string;
    port: number;
    keepAlive: boolean;

}