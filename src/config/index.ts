/*
 * Created on Tue Jul 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export const DefaultConfiguration: OAuthLoginConfig & ClientConfig = {

  locoBookingHost: 'booking-loco.kakao.com',
  locoBookingPort: 443,

  // eslint-disable-next-line max-len
  locoPEMPublicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIDANBgkqhkiG9w0BAQEFAAOCAQ0AMIIBCAKCAQEApElgRBx+g7sniYFW7LE8ivrwXShKTRFV8lXNItMXbN5QSC8vJ/cTSOTS619Xv5Zx7xXJIk4EKxtWesEGbgZpEUP2xQ+IeH9oz0JxayEMvvD1nVNAWgpWE4pociEoArsK7qY3YwXb1CiDHo9hojLv7djbo3cwXvlyMh4TUrX2RjCZPlVJxk/LVjzcl9ohJLkl3eoSrf0AE4kQ9mk3+raEhq5Dv+IDxKYX+fIytUWKmrQJusjtre9oVUX5sBOYZ0dzez/XapusEhUWImmB6mciVXfRXQ8IK4IH6vfNyxMSOTfLEhRYN2SMLzplAYFiMV536tLS3VmG5GJRdkpDubqPeQIBAw==\n-----END PUBLIC KEY-----`,

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
