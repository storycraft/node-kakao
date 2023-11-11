/*
 * Created on Tue Jul 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export const DefaultConfiguration: OAuthLoginConfig & ClientConfig = {

  locoBookingHost: 'booking-loco.kakao.com',
  locoBookingPort: 443,

  // eslint-disable-next-line max-len
  locoPEMPublicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIDANBgkqhkiG9w0BAQEFAAOCAQ0AMIIBCAKCAQEArFhojUWXqu7GRj8GWNIgX5J6w23jbW3spYzLvQqLSKct6EVD6Ut9dfXCA/wCE/9FfPeJBEhqsY5JxYUEHVvz+2m7+cjDCxbQThSG5z1hDSggLxA30QRBF2/gKDo6um9Ng0q4QDO+3+mqVw1cVox0Xt++R4UdNT2BkVG+vp0T2c5e1QdeKvYnHYImPbeocGY+SHRcMWeZPfUrk0bLbnw6O/KDei5LOVk435LEsKHNtj7u4fswCVds4IFtgjjBrtrvhk4CitOcRrVVyeuODIuXy7g3dca1ZLPLxhb6fT25UtKd+8/jFTIMh4n/ul2u6pi7ny+WlEPPeBshwy4iPQ63PQIBAw==\n-----END PUBLIC KEY-----`,

  agent: 'win32',

  version: '3.2.3',
  appVersion: '3.2.3.2698',

  osVersion: '10.0',

  // 2 == sub, 1 == main
  deviceType: 2,
  // 0 == wired(WIFI), 3 == cellular
  netType: 0,
  // 999: pc
  mccmnc: '999',

  countryIso: 'KR',
  language: 'ko',

  subDevice: true,
  deviceModel: '',

  loginTokenSeedList: ['PITT', 'INORAN'],

};

export interface BookingConfig {

  locoBookingHost: string;
  locoBookingPort: number;

  agent: string;
  mccmnc: string;

  deviceModel: string;

}

export interface CheckinConfig extends BookingConfig {

  locoCheckinFallbackHost?: string;
  locoCheckinFallbackPort?: number;

  subDevice: boolean;
  appVersion: string;

  countryIso: string;
  language: string;

  netType: number;

  locoPEMPublicKey: string;
}

export interface WebApiConfig {

  agent: string;

  version: string;
  osVersion: string;

  language: string;
  
  deviceModel: string;

}

export type SessionConfig = CheckinConfig;

export interface ClientConfig extends SessionConfig, WebApiConfig {

  deviceType: number;

}

export interface OAuthLoginConfig extends WebApiConfig {

  loginTokenSeedList: [string, string];

}
