/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionConfig } from '../config';
import { AsyncCommandResult, DefaultReq, DefaultRes } from '../request';
import { BsonDataCodec } from '../packet';
import { PacketAssembler } from './packet-assembler';
import { BiStream } from '../stream';
import { LocoPacketCodec } from './loco-packet-codec';
import { Long } from 'bson';

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

  id: number;
  method: string;
  data: DefaultRes;
  push: boolean;

}

/**
 * Create connection using configuration.
 */
export interface SessionFactory {

  connect(userId: Long, config: SessionConfig): AsyncCommandResult<ConnectionSession>;

}

export class LocoSession implements ConnectionSession {
  private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
 
  private _codec: LocoPacketCodec;

  private _nextPromise: Promise<boolean> | null;

  private _packetBuffer: PacketResData[];
  private _requestSet: Set<number>;

  constructor(stream: BiStream) {
    this._assembler = new PacketAssembler(BsonDataCodec);

    this._codec = new LocoPacketCodec(stream);

    this._nextPromise = null;

    this._packetBuffer = [];
    this._requestSet = new Set();
  }

  get stream(): BiStream {
    return this._codec.stream;
  }

  private _lastBufRes(): PacketResData | undefined {
    if (this._packetBuffer.length > 0) return this._packetBuffer[this._packetBuffer.length - 1];
  }

  private async _readInner(): Promise<boolean> {
    const read = await this._codec.read();

    if (!read) return false;

    const res = {
      id: read.header.id,
      push: !this._requestSet.has(read.header.id),
      method: read.header.method,
      data: this._assembler.deconstruct(read)
    };

    this._packetBuffer.push(res);

    return true;
  }

  private _readQueued(): Promise<boolean> {
    if (this._nextPromise) return this._nextPromise;

    this._nextPromise = this._readInner();
    this._nextPromise.finally(() => this._nextPromise = null);

    return this._nextPromise;
  }

  async read(): Promise<PacketResData | undefined> {
    while (this._packetBuffer.length < 1 && await this._readQueued());

    const first = this._packetBuffer[0];
    if (first && first.push) this._packetBuffer.shift();

    return first;
  }

  private async _readId(id: number): Promise<PacketResData | undefined> {
    if (this._requestSet.has(id)) throw new Error(`Packet id collision #${id}`);
    this._requestSet.add(id);

    while (await this._readQueued()) {
      const read = this._lastBufRes();
      if (read && read.id === id && this._requestSet.has(id)) {
        this._requestSet.delete(id);
        this._packetBuffer.pop();
        return read;
      }
    }
  }

  listen(): AsyncIterableIterator<PacketResData> {
    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<PacketResData> {
        return this;
      },

      next: async (): Promise<IteratorResult<PacketResData>> => {
        const next = await this.read();

        if (!next) return { done: true, value: null };

        return { done: false, value: next };
      }
    };
  }

  async request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
    const req = this._assembler.construct(method, data);
    await this._codec.write(req);
    const res = await this._readId(req.header.id);
    if (!res) throw new Error(`Session closed before response #${req.header.id}`);

    return res.data as DefaultRes & T;
  }
}
