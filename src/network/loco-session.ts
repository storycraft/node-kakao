/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BsonDataCodec, DefaultReq, DefaultRes } from "../packet/bson-data-codec";
import { LocoPacket } from "../packet_old/loco-packet";
import { LocoPacketDispatcher } from "./loco-packet-dispatcher";
import { PacketAssembler } from "./packet-assembler";

/**
 * Holds current loco session.
 * Default implementation encodes to bson.
 */
export class LocoSession {

    private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
    private _dispatcher: LocoPacketDispatcher;

    constructor(dispatcher: LocoPacketDispatcher) {
        this._assembler = new PacketAssembler(BsonDataCodec);
        this._dispatcher = dispatcher;
    }

    get dispatcher() {
        return this._dispatcher;
    }

    sendPacket(packet: LocoPacket) {
        return this._dispatcher.sendPacket(packet);
    }

    /**
     * Construct to packet and send using dispatcher
     * 
     * @param method Packet method
     * @param data Packet data
     */
    async sendData(method: string, data: DefaultReq) {
        const res = await this._dispatcher.sendPacket(this._assembler.construct(method, data));
        return this._assembler.deconstruct(res);
    }

}