/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BiStream } from '../stream';

export interface StreamHook {

  /**
   * Hook data write
   *
   * @param data Write data
   */
  onWrite(data: Uint8Array): void;

  /**
   * Hook data read
   *
   * @param buf Read buffer
   * @param read Read size
   */
  onRead(buf: Uint8Array, read: number | null): void;

  onClose(): void;

}

export class HookedStream implements BiStream {
  constructor(private _stream: BiStream, public hook: Partial<StreamHook> = {}) {

  }

  get ended(): boolean {
    return this._stream.ended;
  }

  write(data: Uint8Array): Promise<number> {
    if (this.hook.onWrite) this.hook.onWrite(data);

    return this._stream.write(data);
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    const read = await this._stream.read(buffer);

    if (this.hook.onRead) this.hook.onRead(buffer, read);

    return read;
  }

  close(): void {
    if (this.hook.onClose) this.hook.onClose();
    this._stream.close();
  }
}
