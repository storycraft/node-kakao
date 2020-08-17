/*
 * Created on Thu Jun 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration } from "../config/client-config";

export namespace HostData {

    export const BookingHost: HostData = {
        host: DefaultConfiguration.locoBookingURL,
        port: DefaultConfiguration.locoBookingPort,
        keepAlive: false
    }

}

export interface HostData {
    
    host: string;
    port: number;
    keepAlive: boolean;

}