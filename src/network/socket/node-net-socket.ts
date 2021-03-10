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

export class NodeSocket implements BiStream {
  private _socket: PromiseSocket<net.Socket>;
  private _ended: boolean;

  private constructor(socket: net.Socket) {
    this._socket = new PromiseSocket(socket);
    this._ended = false;
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    const chunk = await this._socket.read(buffer.byteLength) as Buffer;
    
    if (chunk) buffer.set(chunk, 0);

    return chunk?.byteLength;
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
