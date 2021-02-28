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
   * Try to read data from stream
   */
  iterate(): AsyncIterableIterator<Uint8Array>;

}

/**
 * Writable stream.
 * Data can be written to stream.
 */
export interface WriteStream extends Stream {

  /**
   * Write data
   * @param data
   */
  write(data: Uint8Array): Promise<void>;

}

/**
 * Read / write stream
 */
export interface BiStream extends ReadStream, WriteStream {

}
