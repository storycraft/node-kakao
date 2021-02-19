/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BiStream } from '../stream';

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

export class HookedStream implements BiStream {
  constructor(private _stream: BiStream, public hook: Partial<StreamHook> = {}) {

  }

  get ended(): boolean {
    return this._stream.ended;
  }

  write(data: ArrayBuffer): Promise<void> {
    if (this.hook.onWrite) this.hook.onWrite(data);

    return this._stream.write(data);
  }

  iterate(): AsyncIterableIterator<ArrayBuffer> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
      },
    };
  }

  close(): void {
    if (this.hook.onClose) this.hook.onClose();
    this._stream.close();
  }
}
