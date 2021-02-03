/*
 * Created on Tue Jan 19 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { BookingConfig, CheckinConfig } from '../../config';
import { GetConfRes } from '../../packet/booking/get-conf';
import { CheckinRes } from '../../packet/checkin/checkin';
import { KnownDataStatusCode } from '../../request';
import { AsyncCommandResult } from '../../request';
import { DefaultLocoSession } from '../request-session';
import { BiStream } from '../../stream';

/**
 * Do booking process and return result.
 * Official server require tls.
 *
 * @param stream
 */
export async function getBookingData(stream: BiStream, config: BookingConfig): AsyncCommandResult<GetConfRes> {
  const bookingSession = new DefaultLocoSession(stream);

  (async () => {
    for await (const _ of bookingSession.listen()) { }
  })();

  const req = {
    'MCCMNC': config.mccmnc,
    'model': config.deviceModel,
    'os': config.agent,
  };

  const res = await bookingSession.request<GetConfRes>('GETCONF', req);
  bookingSession.close();

  return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
}

/**
 * Do checkin process and return result.
 * Official server require secure layer.
 *
 * @param stream
 */
export async function getCheckinData(stream: BiStream, config: CheckinConfig, userId?: Long): AsyncCommandResult<CheckinRes> {
  const checkinSession = new DefaultLocoSession(stream);

  (async () => {
    for await (const _ of checkinSession.listen()) { }
  })();

  const req: Record<string, any> = {
    'MCCMNC': config.mccmnc,
    'appVer': config.appVersion,
    'countryISO': config.countryIso,
    'lang': config.language,
    'ntype': config.netType,
    'useSub': config.subDevice,
    'os': config.agent,
  };

  if (userId) {
    req['userId'] = userId;
  }

  const res = await checkinSession.request<CheckinRes>('CHECKIN', req);
  checkinSession.close();

  return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
}
