/*
 * Created on Tue Jan 19 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { BookingConfig, CheckinConfig } from '../../config';
import { GetConfRes } from '../../packet/booking';
import { CheckinRes } from '../../packet/checkin';
import { DefaultReq, KnownDataStatusCode } from '../../request';
import { AsyncCommandResult } from '../../request';
import { LocoSession } from '../request-session';
import { BiStream } from '../../stream';

/**
 * Do booking process and return result.
 * Official server require tls.
 *
 * @param {BiStream} stream
 * @param {BookingConfig} config
 */
export async function getBookingData(stream: BiStream, config: BookingConfig): AsyncCommandResult<GetConfRes> {
  const bookingSession = new LocoSession(stream);

  const req = {
    'MCCMNC': config.mccmnc,
    'model': config.deviceModel,
    'os': config.agent,
  };

  const res = await bookingSession.request<GetConfRes>('GETCONF', req);
  bookingSession.stream.close();

  return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
}

/**
 * Do checkin process and return result.
 * Official server require secure layer.
 *
 * @param {BiStream} stream
 * @param {CheckinConfig} config
 * @param {Long} userId
 */
export async function getCheckinData(
  stream: BiStream,
  config: CheckinConfig,
  userId: Long,
): AsyncCommandResult<CheckinRes> {
  const checkinSession = new LocoSession(stream);

  const req: DefaultReq = {
    'MCCMNC': config.mccmnc,
    'appVer': config.appVersion,
    'countryISO': config.countryIso,
    'lang': config.language,
    'ntype': config.netType,
    'useSub': config.subDevice,
    'os': config.agent,
    userId
  };

  const res = await checkinSession.request<CheckinRes>('CHECKIN', req);
  checkinSession.stream.close();

  return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
}
