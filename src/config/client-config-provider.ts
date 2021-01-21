/*
 * Created on Tue Jul 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export const DefaultConfiguration: LocoLoginConfig & OAuthLoginConfig & ClientConfig = {

    locoBookingURL: 'booking-loco.kakao.com',
    locoBookingPort: 443,

    locoPEMPublicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIDANBgkqhkiG9w0BAQEFAAOCAQ0AMIIBCAKCAQEApElgRBx+g7sniYFW7LE8ivrwXShKTRFV8lXNItMXbN5QSC8vJ/cTSOTS619Xv5Zx7xXJIk4EKxtWesEGbgZpEUP2xQ+IeH9oz0JxayEMvvD1nVNAWgpWE4pociEoArsK7qY3YwXb1CiDHo9hojLv7djbo3cwXvlyMh4TUrX2RjCZPlVJxk/LVjzcl9ohJLkl3eoSrf0AE4kQ9mk3+raEhq5Dv+IDxKYX+fIytUWKmrQJusjtre9oVUX5sBOYZ0dzez/XapusEhUWImmB6mciVXfRXQ8IK4IH6vfNyxMSOTfLEhRYN2SMLzplAYFiMV536tLS3VmG5GJRdkpDubqPeQIBAw==\n-----END PUBLIC KEY-----`,

    agent: 'win32',

    version: '3.1.4',
    appVersion: '3.1.4.2500',

    osVersion: '10.0',

    // sub(pc)
    deviceType: 2,
    // wired
    netType: 0,
    // 999: pc
    mccmnc: '999',

    countryIso: 'KR',
    language: 'ko',

    subDevice: true,
    deviceModel: '',

    xvcSeedList: [ 'HEATH', 'DEMIAN' ],
    loginTokenSeedList: [ 'PITT', 'INORAN' ]

}

export interface ClientConfigOld {

    agent: string;

    locoBookingURL: string;
    locoBookingPort: number;
    
    locoPEMPublicKey: string;

    version: string;
    appVersion: string;

    osVersion: string;
    
    deviceType: number;
    netType: number;
    mccmnc: string;

    countryIso: string;
    language: string;

    subDevice: boolean;
    deviceModel: string;

    xvcSeedList: [ string, string ];
    loginTokenSeedList: [ string, string ];

}

export interface BookingConfig {

    agent: string;
    mccmnc: string;
    deviceModel: string;

}

export interface CheckinConfig extends BookingConfig {

    subDevice: boolean;
    appVersion: string;

    countryIso: string;
    language: string;

    netType: number;
}

export interface WebApiConfig {

    agent: string;

    version: string;

    osVersion: string;
    
    deviceType: number;

}

export interface SessionConfig extends LocoLoginConfig, CheckinConfig {

}

export interface ClientConfig extends SessionConfig, WebApiConfig {

}

export interface OAuthLoginConfig {
    
    xvcSeedList: [ string, string ];
    loginTokenSeedList: [ string, string ];

}

export interface LocoLoginConfig {

    locoBookingURL: string;
    locoBookingPort: number;

    locoPEMPublicKey: string;

}

export interface ClientConfigProvider {

    readonly configuration: ClientConfig;

}

export class DefaultClientConfigProvider implements ClientConfigProvider {

    configuration: ClientConfig;

    constructor(config: ClientConfig) {
        this.configuration = config;
    }

}