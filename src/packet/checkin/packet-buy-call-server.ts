/*
 * Created on Wed Jun 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "../loco-bson-packet";
import { Long } from "bson";

export class PacketBuyCallServerReq extends LocoBsonRequestPacket {

    constructor(
        public UserId: Long = Long.ZERO,
        public Os: string = '',
        public NetType: number = 0,
        public Appver: string = '',
        public NetworkMccMnc: string = '',
        public CountryIso: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'BUYCS';
    }

    toBodyJson() {
        return {
            'userId': this.UserId,
            'os': this.Os,
            'ntype': this.NetType,
            'appVer': this.Appver,
            'MCCMNC': this.NetworkMccMnc,
            'countryISO': this.CountryIso
        };
    }

}

export class PacketBuyCallServerRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public CallServerHost: string = '',
        public CallServerPort: number = 0,
        public CallServerHostV6: string = '',
        public VssHost: string = '',
        public VssPort: string = '',
        public VssHostV6: string = ''
    ) {
        super(status);
    }

    get PacketName() {
        return 'BUYCS';
    }

    readBodyJson(rawData: any) {
        this.CallServerHost = rawData['cshost'];
        this.CallServerPort = rawData['csport'];
        this.CallServerHostV6 = rawData['cshost6'];

        this.VssHost = rawData['vsshost'];
        this.VssPort = rawData['vssport'];
        this.VssHostV6 = rawData['vsshost6'];
    }

}