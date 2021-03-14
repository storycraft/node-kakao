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
 * Additional Readstream util
 */
export namespace ReadStreamUtil {

  /**
   * Create AsyncIterableIterator which read stream buffers up to size bytes.
   *
   * @param {ReadStream} stream
   * @param {number} [size=65535]
   * @return {AsyncIterableIterator<Uint8Array>}
   */
  export function iter(stream: ReadStream, size = 65535): AsyncIterableIterator<Uint8Array> {
    return {
      [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
        return this;
      },
    
      async next(): Promise<IteratorResult<Uint8Array>> {
        const buffer = new Uint8Array(size);
        const read = await stream.read(buffer);
    
        if (!read) return { done: true, value: null };
    
        return { done: false, value: buffer.subarray(0, read) };
      }
    };
  }

  /**
   * Read every data to end of stream.
   *
   * @param {ReadStream} stream
   */
  export async function all(stream: ReadStream): Promise<Uint8Array> {
    const bufferList: Uint8Array[] = [];
    let total = 0;

    for await (const buffer of iter(stream)) {
      bufferList.push(buffer);
      total += buffer.byteLength;
    }

    const data = new Uint8Array(total);

    let offset = 0;
    for (const buffer of bufferList) {
      data.set(buffer, offset);

      offset += buffer.byteLength;
    }

    return data;
  }

  /**
   * Read exact size bytes into Uint8Array or null if the stream ends before to fill all.
   *
   * @param {ReadStream} stream
   * @param {number} size
   */
  export async function exact(stream: ReadStream, size: number): Promise<Uint8Array | null> {
    const data = new Uint8Array(size);
    let read = await stream.read(data);
    if (!read) return null;

    while (read < size) {
      const dataRead = await stream.read(data.subarray(read));
      if (!dataRead) return null;

      read += dataRead;
    }

    return data;
  }

  /**
   * Write every read data from ReadStream to WriteStream.
   *
   * @param {ReadStream} read Stream to be read
   * @param {WriteStream} write Stream to be written
   * @return {Promise<number>} Bytes written.
   */
  export async function copy(read: ReadStream, write: WriteStream): Promise<number> {
    let written = 0;

    for await (const data of iter(read)) {
      if (write.ended) break;
      written += await write.write(data);
    }

    return written;
  }

}

/**
 * Writable stream.
 * Data can be written to stream.
 */
export interface WriteStream extends Stream {

  /**
   * Write data. Written size is always same as data.byteLength, unless the stream ends during writing.
   *
   * @param data
   * @return Written size
   */
   write(data: Uint8Array): Promise<number>;

}

/**
 * Read / write stream
 */
export interface BiStream extends ReadStream, WriteStream {

}
