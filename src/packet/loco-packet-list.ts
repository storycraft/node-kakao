import { LocoRequestPacket, LocoResponsePacket } from "./loco-packet-base";
import { LocoGetConfReq, LocoGetConfRes } from "./loco-get-conf";
import { LocoCheckInReq, LocoCheckInRes } from "./loco-check-in";
import { LocoLoginReq, LocoLoginRes } from "./loco-login";
import { LocoMessageRes, LocoMessageWriteReq } from "./loco-message";
import { LocoMessageReadRes } from "./loco-message-read";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketList {

    private static reqeustPacketMap: Map<string, () => LocoRequestPacket>;
    private static responsePacketMap: Map<string, (status: number) => LocoResponsePacket>;

    static init() {
        LocoPacketList.initReqMap();
        LocoPacketList.initResMap();
    }

    protected static initReqMap() {
        LocoPacketList.reqeustPacketMap = new Map();

        LocoPacketList.reqeustPacketMap.set('GETCONF', () => new LocoGetConfReq());
        LocoPacketList.reqeustPacketMap.set('CHECKIN', () => new LocoCheckInReq());
        LocoPacketList.reqeustPacketMap.set('LOGINLIST', () => new LocoLoginReq());
        LocoPacketList.reqeustPacketMap.set('WRITE', () => new LocoMessageWriteReq());
    }

    protected static initResMap() {
        LocoPacketList.responsePacketMap = new Map();

        LocoPacketList.responsePacketMap.set('GETCONF', (status) => new LocoGetConfRes(status));
        LocoPacketList.responsePacketMap.set('CHECKIN', (status) => new LocoCheckInRes(status));
        LocoPacketList.responsePacketMap.set('LOGINLIST', (status) => new LocoLoginRes(status));
        LocoPacketList.responsePacketMap.set('MSG', (status) => new LocoMessageRes(status));
        LocoPacketList.responsePacketMap.set('DECUNREAD', (status) => new LocoMessageReadRes(status));
    }

    static hasReqPacket(name: string): boolean {
        return LocoPacketList.reqeustPacketMap && LocoPacketList.reqeustPacketMap.has(name);
    }

    static hasResPacket(name: string): boolean {
        return LocoPacketList.responsePacketMap && LocoPacketList.responsePacketMap.has(name);
    }

    static getReqPacketByName(name: string): LocoRequestPacket {
        if (!LocoPacketList.hasReqPacket(name)) {
            throw new Error(`${name} is not valid loco request packet`);
        }

        return LocoPacketList.reqeustPacketMap.get(name)!();
    }

    static getResPacketByName(name: string, status: number): LocoResponsePacket {
        if (!LocoPacketList.hasResPacket(name)) {
            throw new Error(`${name} is not valid loco response packet`);
        }

        return LocoPacketList.responsePacketMap.get(name)!(status);
    }

}

LocoPacketList.init();