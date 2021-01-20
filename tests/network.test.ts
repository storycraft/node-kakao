/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as NetSocket from '../src/network/socket/net-socket';
import { LocoSecureLayer } from '../src/network/loco-secure-layer';
import * as LocoEntry from '../src/network/util/loco-entrance';
import { newCryptoStore } from '../src/crypto/crypto-store';
import { DefaultConfiguration } from '../src/config/client-config-provider';

describe('Network', () => {
    it('Booking & Checkin', async () => {
        const bookingStream = await NetSocket.createTLSSocket({
            host: DefaultConfiguration.locoBookingURL,
            port: DefaultConfiguration.locoBookingPort,
            keepAlive: false
        });
    
        const bookingRes = await LocoEntry.getBookingData(bookingStream, DefaultConfiguration);
    
        if (!bookingRes.success) throw `Booking failed status: ${bookingRes.status}`;

        const checkinStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
            host: bookingRes.result.ticket.lsl[0],
            port: bookingRes.result.wifi.ports[0],
            keepAlive: false
        }), newCryptoStore(DefaultConfiguration.locoPEMPublicKey));
        
        const checkinRes = await LocoEntry.getCheckinData(checkinStream, DefaultConfiguration);
        
        if (!checkinRes.success) throw `Checkin failed status: ${checkinRes.status}`;
    });
});