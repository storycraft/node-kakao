/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from '../config';
import { LocoSession, PacketResData, SessionFactory } from '../network/request-session';
import { DefaultRes, DefaultReq } from '../request';
import { LocoPacket } from '../packet';
import { CommandResult } from '../request';

/**
 * Hook incoming datas
 */
export interface SessionHook {

  /**
   * Hook incoming data
   */
  onData: (method: string, data: DefaultReq, push: boolean) => void;

  /**
   * Hook command requests
   */
  onRequest: (method: string, data: DefaultReq) => void;

  /**
   * Hook loco packet
   */
  onSendPacket: (packet: LocoPacket) => void;

  onClose(): () => void;

}

/**
 * Hook created loco session
 */
export class HookedSessionFactory implements SessionFactory {
  constructor(private _factory: SessionFactory, private _hook: Partial<SessionHook> = {}) {

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
  constructor(private _session: LocoSession, public hook: Partial<SessionHook> = {}) {

  }

  listen(): AsyncIterableIterator<PacketResData> {
    const hook = this.hook;
    const iterator = this._session.listen();

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      async next(): Promise<IteratorResult<PacketResData>> {
        const next = await iterator.next();

        if (!next.done && hook.onData) {
          const { method, data, push } = next.value;

          hook.onData(method, data, push);
        }

        return next;
      },
    };
  }

  request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
    if (this.hook.onRequest) this.hook.onRequest(method, data);

    return this._session.request(method, data);
  }

  sendPacket(packet: LocoPacket): Promise<LocoPacket> {
    if (this.hook.onSendPacket) this.hook.onSendPacket(packet);

    return this._session.sendPacket(packet);
  }

  close(): void {
    if (this.hook.onClose) this.hook.onClose();

    this._session.close();
  }
}
