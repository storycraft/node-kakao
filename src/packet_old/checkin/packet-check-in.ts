import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "../loco-bson-packet";
import { Long } from "bson";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketCheckInReq extends LocoBsonRequestPacket {

    constructor(
        public UserId: Long = Long.ZERO,
        public Os: string = '',
        public NetType: number = 0,
        public Appver: string = '',
        public NetworkMccMnc: string = '',
        public language: string = '',
        public CountryIso: string = '',
        public UseSub: boolean = true) { // true because we are attempting to login with sub device
            super();
    }
    
    get PacketName() {
        return 'CHECKIN';
    }

    toBodyJson() {
        let obj: any = {
            userId: this.UserId,
            os: this.Os,
            ntype: this.NetType,
            appVer: this.Appver,
            MCCMNC: this.NetworkMccMnc,
            lang: this.language,
            useSub: this.UseSub
        };

        if (this.CountryIso) obj['countryISO'] = this.CountryIso;

        return obj;
    }

    
}

export class PacketCheckInRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public Host: string = '',
        public Port: number = 0,
        public CacheExpire: number = -1) {
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