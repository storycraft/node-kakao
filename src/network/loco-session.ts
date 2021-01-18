/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketDataCodec } from "../packet_old/loco-packet";
import { LocoPacketDispatcher } from "./loco-packet-dispatcher";
import { PacketBuilder } from "./packet-builder";

/**
 * Holds current loco session.
 * Default implementation encodes 
 */
export class LocoSession<T = Record<string, any>> {

    private _builder: PacketBuilder<T>;
    private _dispatcher: LocoPacketDispatcher;

    constructor(codec: LocoPacketDataCodec<T>, dispatcher: LocoPacketDispatcher) {
        this._builder = new PacketBuilder(codec);
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
    sendData(method: string, data: T) {
        return this._dispatcher.sendPacket(this._builder.construct(method, data));
    }

}