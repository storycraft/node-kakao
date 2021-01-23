/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from "../config/client-config-provider";
import { BsonDataCodec, DefaultReq, DefaultRes } from "../packet/bson-data-codec";
import { LocoPacket } from "../packet/loco-packet";
import { CommandResult } from "../request/command-result";
import { LocoPacketDispatcher } from "./loco-packet-dispatcher";
import { PacketAssembler } from "./packet-assembler";
import { Stream } from "./stream";

export interface CommandSession {

    /**
     * Request command response
     * 
     * @param method method
     * @param data data
     */
    request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T>;

}

export interface LocoSession extends CommandSession {

    listen(): AsyncIterable<PushPacketData> & AsyncIterator<PushPacketData>;

    sendPacket(packet: LocoPacket): Promise<LocoPacket>;

    close(): void;

}

/**
 * Create LocoSession using configuration.
 */
export interface SessionFactory {

    createSession(config: SessionConfig): Promise<CommandResult<LocoSession>>;

}

export type PushPacketData = [string, DefaultRes];

/**
 * Holds current loco session.
 */
export class DefaultLocoSession implements LocoSession {

    private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
    private _dispatcher: LocoPacketDispatcher;

    constructor(stream: Stream) {
        this._assembler = new PacketAssembler(BsonDataCodec);
        this._dispatcher = new LocoPacketDispatcher(stream);
    }

    listen() {
        const iterator = this._dispatcher.listen();
        const assembler = this._assembler;

        return {
            [Symbol.asyncIterator](): AsyncIterator<PushPacketData> {
                return this;
            },

            async next(): Promise<IteratorResult<PushPacketData>> {
                const next = await iterator.next();

                if (next.done) return { done: true, value: null };
                const pushPacket = next.value as LocoPacket;

                return { done: false, value: [pushPacket.header.method, assembler.deconstruct(pushPacket)] };
            }
        }
    }

    async request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
        const res = await this._dispatcher.sendPacket(this._assembler.construct(method, data));
        return this._assembler.deconstruct(res) as unknown as DefaultRes & T;
    }

    sendPacket(packet: LocoPacket) {
        return this._dispatcher.sendPacket(packet);
    }

    /**
     * Close session
     */
    close() {
        this._dispatcher.stream.close();
    }

}