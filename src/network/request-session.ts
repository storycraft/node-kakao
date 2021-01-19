/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BsonDataCodec, DefaultReq, DefaultRes } from "../packet/bson-data-codec";
import { LocoPacketDispatcher } from "./loco-packet-dispatcher";
import { PacketAssembler } from "./packet-assembler";

export interface CommandSession {

    /**
     * Request command response
     * 
     * @param method method
     * @param data data
     */
    request(method: string, data: DefaultReq): Promise<DefaultRes>;

}

/**
 * Holds current loco session.
 */
export class LocoSession implements CommandSession {

    private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
    private _dispatcher: LocoPacketDispatcher;

    constructor(dispatcher: LocoPacketDispatcher) {
        this._assembler = new PacketAssembler(BsonDataCodec);
        this._dispatcher = dispatcher;
    }

    listen() {
        return this._dispatcher.listen();
    }

    /**
     * Create proxy that can be used safely without exposing dispatcher
     */
    createProxy(): CommandSession {
        return {
            request: this.request.bind(this)
        }
    }

    async request(method: string, data: DefaultReq) {
        const res = await this._dispatcher.sendPacket(this._assembler.construct(method, data));
        return this._assembler.deconstruct(res);
    }

}