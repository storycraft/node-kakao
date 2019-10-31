import { KakaoAPI } from "../kakao-api";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketCheckInReq extends LocoBsonRequestPacket {

    constructor(
        public UserId: number = 0,
        public Os: string = KakaoAPI.Agent,
        public NetType: number = 0,
        public Appver: string = KakaoAPI.InternalAppVersion,
        public NetworkMccMnc: string = '',
        public language: string = 'ko',
        public CountryIso: string = 'KR',
        public UseSub: boolean = true) { // true because we are attempting to login with sub device
            super();
    }
    
    get PacketName() {
        return 'CHECKIN';
    }

    toBodyJson() {
        return {
            userId: this.UserId,
            os: this.Os,
            ntype: this.NetType,
            appVer: this.Appver,
            MCCMNC: this.NetworkMccMnc,
            lang: this.language,
            useSub: this.UseSub
        };
    }

    
}

export class PacketCheckInRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Host: string = '',
        public Port: number = 0,
        public CacheExpire: number = -1) { // true because we are attempting to login with sub device
            super(status);
    }
    
    get PacketName() {
        return 'CHECKIN';
    }

    readBodyJson(body: any) {
        this.Host = body['host'];
        this.Port = body['port'];
        this.CacheExpire = body['cacheExpire'];
    }

    
}