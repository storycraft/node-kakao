/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ReadStream, WriteStream } from '.';

interface FixedStream {

  /**
   * Returns true if operation has done and cannot be written / read more
   */
  readonly done: boolean;

  /**
   * Total size that can be write or read
   */
  readonly size: number;

}

/**
 * Fixed sized stream that can be used for reading.
 * Extra bytes are removed.
 */
export class FixedReadStream implements ReadStream, FixedStream {
  private _read: number;

  constructor(private _stream: ReadStream, private _size: number) {
    this._read = 0;
  }

  get size(): number {
    return this._size;
  }

  /**
   * Read size
   */
  get read(): number {
    return this._read;
  }

  get done(): boolean {
    return this._read >= this._size;
  }

  iterate(): AsyncIterableIterator<ArrayBuffer> {
    const iterable = this._stream.iterate();
    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async () => {
        if (this.done) {
          return { done: true, value: null };
        }

        const next = await iterable.next();
        if (next.done) {
          return next;
        }

        this._read += next.value.byteLength;

        if (this._read > this._size) {
          return { done: false, value: next.value.slice(0, this._read - this._size) };
        }

        return { done: false, value: next.value };
      },
    };
  }

  get ended(): boolean {
    return this._stream.ended;
  }

  close(): void {
    this._stream.close();
  }
}

export class FixedWriteStream implements WriteStream, FixedStream {
  private _written: number;

  constructor(private _stream: WriteStream, private _size: number) {
    this._written = 0;
  }

  get size(): number {
    return this._size;
  }

  get done(): boolean {
    return this._written >= this._size;
  }

  /**
   * Written size
   */
  get written(): number {
    return this._written;
  }

  async write(data: ArrayBuffer): Promise<void> {
    if (this._written + data.byteLength > this._size) throw new Error('Write size exceeded');
    await this._stream.write(data);
    this._written += data.byteLength;
  }

  get ended(): boolean {
    return this._stream.ended;
  }

  close(): void {
    this._stream.close();
  }
}
