/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { NetSocketOptions } from ".";
import { Stream } from "../stream";

// Typings hack
type Conn = any;
declare const Deno: any;

export class DenoSocket implements Stream {

    private _ended: boolean;

    constructor(private _conn: Conn) {
        this._ended = false;
    }

    get ended() {
        return this._ended;
    }

    write(data: ArrayBuffer): void {
        this._conn.write(new Uint8Array(data));
    }

    iterate(): AsyncIterableIterator<ArrayBuffer> {
        const iter = Deno.iter(this._conn);

        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            next: async () => {
                const next = await iter.next();
                if (next.done) {
                    this._ended = true;
                    return next;
                }

                return { done: false, value: next.value };
            }
        }
    }
    
    close(): void {
        this._conn.close();
        this._ended = true;
    }

    static async connect(option: NetSocketOptions): Promise<Stream> {
        return new DenoSocket(await Deno.connect({ hostname: option.host, port: option.port }));
    }

    static async connectTls(option: NetSocketOptions): Promise<Stream> {
        return new DenoSocket(await Deno.connectTls({ hostname: option.host, port: option.port }));
    }

}