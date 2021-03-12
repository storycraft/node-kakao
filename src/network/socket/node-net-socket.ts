/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BiStream } from '../../stream';
import * as net from 'net';
import * as tls from 'tls';
import { NetSocketOptions } from '.';
import { PromiseSocket } from 'promise-socket';
import { ChunkedArrayBufferList } from '../chunk';

export class NodeSocket implements BiStream {
  private _socket: PromiseSocket<net.Socket>;
  private _ended: boolean;

  private _chunks: ChunkedArrayBufferList;

  private constructor(socket: net.Socket) {
    this._socket = new PromiseSocket(socket);
    this._ended = false;

    this._chunks = new ChunkedArrayBufferList();
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    if (this._chunks.byteLength < buffer.byteLength) {
      const chunk = await this._socket.read() as Buffer | undefined;
      if (!chunk) return null;
      this._chunks.append(chunk);
    }

    const data = this._chunks.toBuffer();
    this._chunks.clear();

    let view = data;
    if (data.byteLength > buffer.byteLength) {
      this._chunks.append(data.subarray(buffer.byteLength));
      view = data.subarray(0, buffer.byteLength);
    }
    
    buffer.set(view, 0);

    return view.byteLength;
  }

  get ended(): boolean {
    return this._ended;
  }

  write(data: Uint8Array): Promise<number> {
    return this._socket.write(Buffer.from(data));
  }

  close(): void {
    if (this._ended) throw new Error('Tried to close socket already closed');

    this._ended = true;
    this._socket.end();
  }

  static connect(option: NetSocketOptions): Promise<BiStream> {
    return new Promise<NodeSocket>((resolve, reject) => {
      const onErr = (err: unknown) => {
        reject(err);
      };

      const socket = net.connect(option, () => {
        socket.off('error', onErr);
        resolve(new NodeSocket(socket));
      });
      socket.setKeepAlive(option.keepAlive);

      socket.on('error', onErr);
    });
  }

  static connectTls(option: NetSocketOptions): Promise<BiStream> {
    return new Promise<NodeSocket>((resolve, reject) => {
      const onErr = (err: unknown) => {
        reject(err);
      };

      const socket = tls.connect(option, () => {
        socket.off('error', onErr);
        resolve(new NodeSocket(socket));
      });
      socket.setKeepAlive(option.keepAlive);

      socket.on('error', onErr);
    });
  }
}
