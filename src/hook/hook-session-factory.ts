/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { nextTick } from "process";
import { SessionConfig } from "../config/client-config-provider";
import { LocoSession, PushPacketData, SessionFactory } from "../network/request-session";
import { DefaultRes, DefaultReq } from "../packet/bson-data-codec";
import { LocoPacket } from "../packet/loco-packet";
import { CommandResult } from "../request/command-result";

/**
 * Hook incoming datas
 */
export interface IncomingHook {

    /**
     * Hook incoming data
     */
    onData: (method: string, data: DefaultReq) => void;

    onClose(): () => void;

}

/**
 * Hook outgoing datas
 */
export interface OutgoingHook {

    /**
     * Hook command requests
     */
    onRequest: (method: string, data: DefaultReq) => void;

    /**
     * Hook loco packet
     */
    onSendPacket: (packet: LocoPacket) => void;

}

/**
 * Hook created loco session
 */
export class HookedSessionFactory implements SessionFactory {

    constructor(private _factory: SessionFactory, private _hook: Partial<IncomingHook & OutgoingHook> = {}) {

    }

    async createSession(config: SessionConfig): Promise<CommandResult<LocoSession>> {
        const sessionRes = await this._factory.createSession(config);
        if (!sessionRes.success) return sessionRes;
    
        return { status: sessionRes.status, success: true, result: new HookedLocoSession(sessionRes.result, this._hook) };
    }

}

/**
 * Hook loco session
 */
export class HookedLocoSession implements LocoSession {

    constructor(private _session: LocoSession, private _hook: Partial<IncomingHook & OutgoingHook> = {}) {

    }

    listen() {
        const hook = this._hook;
        const iterator = this._session.listen();

        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            async next(): Promise<IteratorResult<PushPacketData>> {
                const next = await iterator.next();

                if (!next.done && hook.onData)  hook.onData(...next.value);

                return next;
            }
        }
    }

    request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
        if (this._hook.onRequest) this._hook.onRequest(method, data);

        return this._session.request(method, data);
    }

    sendPacket(packet: LocoPacket): Promise<LocoPacket> {
        if (this._hook.onSendPacket) this._hook.onSendPacket(packet);

        return this._session.sendPacket(packet);
    }

    close(): void {
        if (this._hook.onClose) this._hook.onClose();

        this._session.close();
    }

}