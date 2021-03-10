/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ReadStream, ReadStreamIter, WriteStream } from '.';

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
  get readd(): number {
    return this._read;
  }

  get done(): boolean {
    return this._read >= this._size;
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    if (this.done) return 0;

    let view: Uint8Array = buffer;
    if (this._read + view.byteLength > this._size) {
      view = buffer.subarray(0, Math.max(this._size - this._read, 0));
    }

    const read = await this._stream.read(view);

    if (read) this._read += read;

    return read;
  }

  /**
   * Read every data into single Uint8Array
   *
   * @return {Uint8Array}
   */
  async all(): Promise<Uint8Array> {
    const data = new Uint8Array(this._size);

    let read = 0;
    for await (const chunk of new ReadStreamIter(this._stream)) {
      data.set(chunk, read);
      read += chunk.byteLength;
    }

    return data;
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

  async write(data: Uint8Array): Promise<number> {
    if (this.done) return 0;

    const written = await this._stream.write(data);

    this._written += written;

    return written;
  }

  get ended(): boolean {
    return this._stream.ended;
  }

  close(): void {
    this._stream.close();
  }
}
