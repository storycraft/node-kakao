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

  connect(config: SessionConfig): AsyncCommandResult<ConnectionSession>;

}

export class LocoSession implements ConnectionSession {
  private _assembler: PacketAssembler<DefaultReq, DefaultRes>;
 
  private _codec: LocoPacketCodec;

  private _nextPromise: Promise<PacketResData | undefined> | null;

  private _pushBufferMap: Map<number, PacketResData>;

  constructor(stream: BiStream) {
    this._assembler = new PacketAssembler(BsonDataCodec);

    this._codec = new LocoPacketCodec(stream);

    this._nextPromise = null;

    this._pushBufferMap = new Map();
  }

  get stream(): BiStream {
    return this._codec.stream;
  }

  private async _readInner(): Promise<PacketResData | undefined> {
    const read = await this._codec.read();

    if (!read) return;

    const res = {
      id: read.header.id,
      push: read.data[0] == 8,
      method: read.header.method,
      data: this._assembler.deconstruct(read)
    };

    return res;
  }

  private _readQueued(): Promise<PacketResData | undefined> {
    if (this._nextPromise) return this._nextPromise;

    this._nextPromise = this._readInner();
    this._nextPromise.finally(() => this._nextPromise = null);

    return this._nextPromise;
  }

  async read(): Promise<PacketResData | undefined> {
    for (const buffered of this._pushBufferMap.values()) {
      this._pushBufferMap.delete(buffered.id);
      return buffered;
    }

    return this._readQueued();
  }

  private async _readId(id: number): Promise<PacketResData | undefined> {
    let read;
    while (read = await this._readQueued()) {
      if (read.id === id) {
        return read;
      } else if (read.push && !this._pushBufferMap.has(read.id)) {
        this._pushBufferMap.set(read.id, read);
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
