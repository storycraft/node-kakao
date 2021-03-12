/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from '../config';
import { AsyncCommandResult, DefaultReq, DefaultRes } from '../request';
import { BsonDataCodec } from '../packet';
import { LocoPacketDispatcher } from './loco-packet-dispatcher';
import { PacketAssembler } from './packet-assembler';
import { BiStream } from '../stream';

export interface CommandSession {

  /**
   * Request command response
   *
   * @param method method
   * @param data data
   */
  request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T>;

}

export interface ConnectionSession extends CommandSession {

  /**
   * Connection stream
   */
  readonly stream: BiStream;

  /**
   * Listen incoming packets
   */
  listen(): AsyncIterableIterator<PacketResData>;

}

export interface PacketResData {

  method: string;
  data: DefaultRes;
  push: boolean;

}

/**
 * Create connection using configuration.
 */
export interface SessionFactory {

  connect(config: SessionConfig): AsyncCommandResult<ConnectionSession>;

}

export class LocoSession implements ConnectionSession {
  private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
  private _dispatcher: LocoPacketDispatcher;

  constructor(stream: BiStream) {
    this._assembler = new PacketAssembler(BsonDataCodec);
    this._dispatcher = new LocoPacketDispatcher(stream);
  }

  get stream(): BiStream {
    return this._dispatcher.stream;
  }

  listen(): AsyncIterableIterator<PacketResData> {
    const iterator = this._dispatcher.listen();
    const assembler = this._assembler;

    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<PacketResData> {
        return this;
      },

      async next(): Promise<IteratorResult<PacketResData>> {
        const next = await iterator.next();

        if (next.done) return { done: true, value: null };
        const { push, packet } = next.value;

        return { done: false, value: { push, method: packet.header.method, data: assembler.deconstruct(packet) } };
      }
    };
  }

  async request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
    const res = await this._dispatcher.sendPacket(this._assembler.construct(method, data));
    return this._assembler.deconstruct(res) as DefaultRes & T;
  }
}
