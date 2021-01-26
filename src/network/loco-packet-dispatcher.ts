/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket } from "../packet/loco-packet";
import { LocoPacketCodec } from "./loco-packet-codec";
import { Stream } from "./stream";

export interface PacketRes {

    push: boolean,
    packet: LocoPacket

}

export class LocoPacketDispatcher {

    private _codec: LocoPacketCodec;

    private _packetMap: Map<number, [resolve: (value: LocoPacket | PromiseLike<LocoPacket>) => void, reject: (reason?: any) => void]>;

    constructor(stream: Stream) {
        this._codec = new LocoPacketCodec(stream);
        this._packetMap = new Map();
    }

    get stream() {
        return this._codec.stream;
    }

    /**
     * Send packet.
     *
     * @returns response
     */
    sendPacket(packet: LocoPacket) {
        if (this._packetMap.has(packet.header.id)) throw new Error(`Packet#${packet.header.id} can conflict`);

        return new Promise<LocoPacket>((resolve, reject) => {
            this._packetMap.set(packet.header.id, [resolve, reject]);
            this._codec.send(packet);
        });
    }

    /**
     * Listen and process incoming packets.
     */
    listen() {
        const instance = this;
        const iterator = this._codec.iterate();

        return {
            [Symbol.asyncIterator](): AsyncIterator<Readonly<PacketRes>> {
                return this;
            },

            async next(): Promise<IteratorResult<Readonly<PacketRes>>> {
                const next = await iterator.next();

                if (next.done) return { done: true, value: null };

                const packet = next.value;

                if (instance._packetMap.has(packet.header.id)) {
                    instance._packetMap.get(packet.header.id)![0](packet);
                    instance._packetMap.delete(packet.header.id);
                    return { done: false, value: { push: false, packet } };
                } else {
                    return { done: false, value: { push: true, packet } };
                }
            }
        };
    }

}