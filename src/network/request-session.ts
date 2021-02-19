/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from '../config';
import { DefaultReq, DefaultRes } from '../request';
import { BsonDataCodec, LocoPacket } from '../packet';
import { CommandResult } from '../request';
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

export interface PacketResData {

  method: string;
  data: DefaultRes;
  push: boolean;

}

export interface LocoSession extends CommandSession {

  listen(): AsyncIterable<PacketResData> & AsyncIterator<PacketResData>;

  sendPacket(packet: LocoPacket): Promise<LocoPacket>;

  close(): void;

}

/**
 * Create LocoSession using configuration.
 */
export interface SessionFactory {

  createSession(config: SessionConfig): Promise<CommandResult<LocoSession>>;

}

/**
 * Holds current loco session.
 */
export class DefaultLocoSession implements LocoSession {
  private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
  private _dispatcher: LocoPacketDispatcher;

  constructor(stream: BiStream) {
    this._assembler = new PacketAssembler(BsonDataCodec);
    this._dispatcher = new LocoPacketDispatcher(stream);
  }

  listen(): { [Symbol.asyncIterator](): AsyncIterator<PacketResData>, next(): Promise<IteratorResult<PacketResData>> } {
    const iterator = this._dispatcher.listen();
    const assembler = this._assembler;

    return {
      [Symbol.asyncIterator](): AsyncIterator<PacketResData> {
        return this;
      },

      async next(): Promise<IteratorResult<PacketResData>> {
        const next = await iterator.next();

        if (next.done) return { done: true, value: null };
        const { push, packet } = next.value;

        return { done: false, value: { push, method: packet.header.method, data: assembler.deconstruct(packet) } };
      },
    };
  }

  async request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
    const res = await this._dispatcher.sendPacket(this._assembler.construct(method, data));
    return this._assembler.deconstruct(res) as DefaultRes & T;
  }

  sendPacket(packet: LocoPacket): Promise<LocoPacket> {
    return this._dispatcher.sendPacket(packet);
  }

  /**
   * Close session
   */
  close(): void {
    this._dispatcher.stream.close();
  }
}
