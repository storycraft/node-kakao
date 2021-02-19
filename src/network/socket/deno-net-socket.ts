/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { NetSocketOptions } from '.';
import { BiStream } from '../../stream';

export class DenoSocket implements BiStream {
  private _ended: boolean;

  constructor(private _conn: Deno.Conn) {
    this._ended = false;
  }

  get ended(): boolean {
    return this._ended;
  }

  async write(data: ArrayBuffer): Promise<void> {
    await this._conn.write(new Uint8Array(data));
  }

  iterate(): AsyncIterableIterator<ArrayBuffer> {
    const iter = Deno.iter(this._conn);

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async () => {
        const next = await iter.next();
        if (next.done) this._ended = true;

        return next;
      },
    };
  }

  close(): void {
    this._conn.close();
    this._ended = true;
  }

  static async connect(option: NetSocketOptions): Promise<BiStream> {
    return new DenoSocket(await Deno.connect({ hostname: option.host, port: option.port }));
  }

  static async connectTls(option: NetSocketOptions): Promise<BiStream> {
    return new DenoSocket(await Deno.connectTls({ hostname: option.host, port: option.port }));
  }
}
