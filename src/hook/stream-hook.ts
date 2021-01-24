/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Stream } from "../network/stream";

export interface StreamHook {

    /**
     * Hook data write
     * @param data 
     */
    onWrite(data: ArrayBuffer): void;

    /**
     * Hook data read
     * @param buf 
     */
    onRead(buf: ArrayBuffer): void;

    onClose(): void;

}

export class HookedStream implements Stream {

    constructor(private _stream: Stream, public hook: Partial<StreamHook> = {}) {

    }

    get ended() {
        return this._stream.ended;
    }

    write(data: ArrayBuffer): void {
        if (this.hook.onWrite) this.hook.onWrite(data);

        this._stream.write(data);
    }

    iterate() {
        const instance = this;
        const iterator = this._stream.iterate();
        
        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            async next(): Promise<IteratorResult<ArrayBuffer>> {
                for await (const data of iterator) {
                    if (instance.hook.onRead) instance.hook.onRead(data);
                    return { done: false, value: data };
                }

                return { done: true, value: null };
            }
        }
    }
    
    close(): void {
        if (this.hook.onClose) this.hook.onClose();
        this._stream.close();
    }

}