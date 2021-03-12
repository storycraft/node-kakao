/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from '../config';
import { ConnectionSession, PacketResData, SessionFactory } from '../network/request-session';
import { DefaultReq, AsyncCommandResult, DefaultRes } from '../request';
import { BiStream } from '../stream';

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

  onClose(): () => void;

}

/**
 * Hook created loco session
 */
export class HookedSessionFactory implements SessionFactory {
  constructor(private _factory: SessionFactory, private _hook: Partial<SessionHook> = {}) {

  }

  async connect(config: SessionConfig): AsyncCommandResult<ConnectionSession> {
    const sessionRes = await this._factory.connect(config);
    if (!sessionRes.success) return sessionRes;

    return { status: sessionRes.status, success: true, result: new InspectSession(sessionRes.result, this._hook) };
  }
}

export class InspectSession implements ConnectionSession {

  constructor(
    private _session: ConnectionSession,
    private _hook: Partial<SessionHook> = {}
  ) {

  }

  get stream(): BiStream {
    return this._session.stream;
  }
  
  request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
    if (this._hook.onRequest) this._hook.onRequest(method, data);

    return this._session.request(method, data);
  }

  listen(): AsyncIterableIterator<PacketResData> {
    const iterator = this._session.listen();

    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<PacketResData> {
        return this;
      },

      next: async (): Promise<IteratorResult<PacketResData>> => {
        const next = await iterator.next();

        if (!next.done && this._hook.onData) {
          this._hook.onData(next.value.method, next.value.data, next.value.push);
        }

        return next;
      }
    };
  }

}
