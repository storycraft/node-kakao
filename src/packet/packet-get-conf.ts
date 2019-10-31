import { KakaoAPI } from "../kakao-api";
import { LocoRequestPacket } from "./loco-packet-base";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { HostData } from "../loco/loco-manager";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


export class PacketGetConfReq extends LocoBsonRequestPacket {

    constructor(
        public NetworkMccMnc: string = '',
        public Os: string = KakaoAPI.Agent,
        public model: string = ''
    ) {
        super();
    }

    get PacketName() {
        return 'GETCONF';
    }

    toBodyJson() {
        return {
            MCCMNC: this.NetworkMccMnc,
            os: this.Os,
            model: this.model
        };
    }
}

export class PacketGetConfRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public HostList: string[] = [],
        public PortList: number[] = [],
        public Revision: number = 0
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETCONF';
    }

    readBodyJson(body: any) {
        this.HostList = [];
        this.PortList = [];

        let hostList: string[] = body['ticket']['lsl'];
        let portList: number[] = body['wifi']['ports'];

        for (let host of hostList) {
            this.HostList.push(host);
        }

        for (let port of portList) {
            this.PortList.push(port);
        }

        if (body['revision']) {
            this.Revision = body['revision'];
        }
    }
}