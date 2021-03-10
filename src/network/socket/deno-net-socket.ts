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

  read(buffer: Uint8Array): Promise<number | null> {
    return this._conn.read(buffer);
  }

  write(data: Uint8Array): Promise<number> {
    return this._conn.write(data);
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
