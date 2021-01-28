/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from "../../config/client-config-provider";
import { newCryptoStore } from "../../crypto";
import { LocoSecureLayer } from "../../network/loco-secure-layer";
import { DefaultLocoSession, LocoSession, SessionFactory } from "../../network/request-session";
import { getBookingData, getCheckinData } from "../../network/util/loco-entrance";
import { CommandResult } from "../../request";
import * as NetSocket from "../../network/socket";
import { KnownDataStatusCode } from "../../packet/status-code";

/**
 * Create loco stream by performing booking and checkin.
 */
export class TalkSessionFactory implements SessionFactory {

    constructor() {

    }

    async createSession(config: SessionConfig): Promise<CommandResult<LocoSession>> {
        const bookingStream = await NetSocket.createTLSSocket({
            host: config.locoBookingURL,
            port: config.locoBookingPort,
            keepAlive: false
        });

        const bookingRes = await getBookingData(bookingStream, config);
        if (!bookingRes.success) return { status: bookingRes.status, success: false };

        const checkinStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
            host: bookingRes.result.ticket.lsl[0],
            port: bookingRes.result.wifi.ports[0],
            keepAlive: false
        }), await newCryptoStore(config.locoPEMPublicKey));

        const checkinRes = await getCheckinData(checkinStream, config);
        if (!checkinRes.success) return { status: checkinRes.status, success: false };

        const locoStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
            host: checkinRes.result.host,
            port: checkinRes.result.port,
            keepAlive: true
        }), await newCryptoStore(config.locoPEMPublicKey));

        return { status: KnownDataStatusCode.SUCCESS, success: true, result: new DefaultLocoSession(locoStream) };
    }

}