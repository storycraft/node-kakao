/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './fixed';

/**
 * Stream instance holds specific input or output resource
 */
export interface Stream {

  /**
   * Indicate current stream is ended or not
   */
  readonly ended: boolean;

  /**
   * Close current stream
   */
  close(): void;

}

/**
 * Readable stream.
 * Data can be read from stream.
 */
export interface ReadStream extends Stream {

  /**
   * Read data up to size bytes.
   *
   * @param buffer Read buffer
   * @return Read size or null on ended
   */
   read(buffer: Uint8Array): Promise<number | null>;

}

/**
 * Writable stream.
 * Data can be written to stream.
 */
export interface WriteStream extends Stream {

  /**
   * Write data
   *
   * @param data
   * @return Written size
   */
   write(data: Uint8Array): Promise<number>;

}

/**
 * Fixed sized read iterator of ReadStream
 */
export class ReadStreamIter implements AsyncIterable<Uint8Array>, AsyncIterableIterator<Uint8Array> {

  constructor(private _stream: ReadStream, private _size = 65535) {

  }

  [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
    return this;
  }

  async next(): Promise<IteratorResult<Uint8Array>> {
    const buffer = new Uint8Array(this._size);
    const read = await this._stream.read(buffer);

    if (!read) return { done: true, value: null };

    return { done: false, value: buffer.subarray(0, read) };
  }

}

/**
 * Read / write stream
 */
export interface BiStream extends ReadStream, WriteStream {

}
