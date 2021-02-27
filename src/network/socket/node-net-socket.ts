/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BiStream } from '../../stream';
import * as net from 'net';
import * as tls from 'tls';
import { NetSocketOptions } from '.';

export class NodeSocket implements BiStream {
  private _socket: net.Socket;
  private _ended: boolean;

  private constructor(socket: net.Socket) {
    this._socket = socket;
    this._ended = false;
  }

  iterate(): AsyncIterableIterator<ArrayBuffer> {
    const iterator = this._socket[Symbol.asyncIterator]();

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async () => {
        const next = await iterator.next();
        if (next.done) this._ended = true;

        return next;
      },
    };
  }

  get ended(): boolean {
    return this._ended;
  }

  write(data: ArrayBuffer): Promise<void> {
    if (this._ended) throw new Error('Tried to send data from closed socket');

    return new Promise(
      (resolve, reject) => this._socket.write(
        new Uint8Array(data),
        (err) => {
          if (err) reject(err); else resolve();
        })
      );
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
