/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BookingConfig, CheckinConfig, SessionConfig } from '../../config';
import { newCryptoStore } from '../../crypto';
import {
  DefaultLocoSession,
  getBookingData,
  getCheckinData,
  LocoSecureLayer,
  LocoSession,
  SessionFactory,
} from '../../network';
import { AsyncCommandResult, KnownDataStatusCode } from '../../request';
import * as NetSocket from '../../network/socket';
import { GetConfRes } from '../../packet/booking';
import { CheckinRes } from '../../packet/checkin';

/**
 * Create loco stream by performing booking and checkin.
 */
export class TalkSessionFactory implements SessionFactory {
  async getConf(config: BookingConfig): AsyncCommandResult<GetConfRes> {
    const bookingStream = await NetSocket.createTLSSocket({
      host: config.locoBookingHost,
      port: config.locoBookingPort,
      keepAlive: false,
    });

    return getBookingData(bookingStream, config);
  }

  async getCheckin(config: CheckinConfig): AsyncCommandResult<CheckinRes> {
    let checkinStream;
    const checkinCrypto = await newCryptoStore(config.locoPEMPublicKey);
    try {
      const conf = await this.getConf(config);
      if (!conf.success) return conf;

      checkinStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
        host: conf.result.ticket.lsl[0],
        port: conf.result.wifi.ports[0],
        keepAlive: false,
      }), checkinCrypto);
    } catch (e) {
      if (!config.locoCheckinFallbackHost || !config.locoCheckinFallbackPort) throw e;
      // Fallback

      checkinStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
        host: config.locoCheckinFallbackHost,
        port: config.locoCheckinFallbackPort,
        keepAlive: false,
      }), checkinCrypto);
    }

    return getCheckinData(checkinStream, config);
  }

  async createSession(config: SessionConfig): AsyncCommandResult<LocoSession> {
    const checkinRes = await this.getCheckin(config);
    if (!checkinRes.success) return checkinRes;

    const locoStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
      host: checkinRes.result.host,
      port: checkinRes.result.port,
      keepAlive: true,
    }), await newCryptoStore(config.locoPEMPublicKey));

    return { status: KnownDataStatusCode.SUCCESS, success: true, result: new DefaultLocoSession(locoStream) };
  }
}
