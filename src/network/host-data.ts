/*
 * Created on Thu Jun 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Configuration } from "../configuration";

export namespace HostData {

    export const BookingHost: HostData = {
        host: Configuration.LocoEntry,
        port: Configuration.LocoEntryPort,
        keepAlive: false
    }

}

export interface HostData {
    
    host: string;
    port: number;
    keepAlive: boolean;

}