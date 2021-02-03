/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CryptoStore } from '../crypto';
import { ChunkedArrayBufferList } from './chunk';
import { BiStream } from '../stream';

/**
 * Loco secure layer that encrypt outgoing packets
 */
export class LocoSecureLayer implements BiStream {
  private _stream: BiStream;
  private _crypto: CryptoStore;

  private _handshaked: boolean;

  constructor(socket: BiStream, crypto: CryptoStore) {
    this._stream = socket;
    this._crypto = crypto;

    this._handshaked = false;
  }

  iterate(): AsyncIterableIterator<ArrayBuffer> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const instance = this;
    const iterator = instance._stream.iterate();

    const headerBufferList = new ChunkedArrayBufferList();
    const packetBufferList = new ChunkedArrayBufferList();

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      async next(): Promise<IteratorResult<ArrayBuffer>> {
        if (instance._stream.ended) {
          return { done: true, value: null };
        }

        if (headerBufferList.byteLength < 20) {
          for await (const data of iterator) {
            headerBufferList.append(data);

            if (headerBufferList.byteLength >= 20) break;
          }

          if (instance._stream.ended) {
            return { done: true, value: null };
          }
        }

        const headerBuffer = headerBufferList.toBuffer();

        const dataSize = new DataView(headerBuffer).getUint32(0, true) - 16;
        const iv = headerBuffer.slice(4, 20);

        if (headerBuffer.byteLength > 20) {
          packetBufferList.append(headerBuffer.slice(20));
        }
        headerBufferList.clear();

        if (packetBufferList.byteLength < dataSize) {
          for await (const data of iterator) {
            packetBufferList.append(data);

            if (packetBufferList.byteLength >= dataSize) break;
          }

          if (instance._stream.ended && packetBufferList.byteLength < dataSize) {
            return { done: true, value: null };
          }
        }

        const dataBuffer = packetBufferList.toBuffer();
        if (dataBuffer.byteLength > dataSize) {
          headerBufferList.append(dataBuffer.slice(dataSize));
        }
        packetBufferList.clear();

        return { done: false, value: instance._crypto.toAESDecrypted(dataBuffer.slice(0, dataSize), iv) };
      },
    };
  }

  get ended(): boolean {
    return this._stream.ended;
  }

  get crypto(): CryptoStore {
    return this._crypto;
  }

  /**
   * @return {BiStream} original stream
   */
  get stream(): BiStream {
    return this._stream;
  }

  /**
   * @return {boolean} true if handshake sent.
   */
  get handshaked(): boolean {
    return this._handshaked;
  }

  async write(data: ArrayBuffer): Promise<void> {
    if (!this._handshaked) {
      await this.sendHandshake();
      this._handshaked = true;
    }

    const iv = this._crypto.randomCipherIV();
    const encrypted = this._crypto.toAESEncrypted(data, iv);

    const packet = new ArrayBuffer(encrypted.byteLength + 20);

    new DataView(packet).setUint32(0, encrypted.byteLength + 16, true);

    const packetArr = new Uint8Array(packet);
    packetArr.set(new Uint8Array(iv), 4);
    packetArr.set(new Uint8Array(encrypted), 20);

    return this._stream.write(packet);
  }

  protected async sendHandshake(): Promise<void> {
    const encryptedKey = this._crypto.getRSAEncryptedKey();
    const handshakePacket = new ArrayBuffer(12 + encryptedKey.byteLength);

    const view = new DataView(handshakePacket);

    view.setUint32(0, encryptedKey.byteLength, true);
    view.setUint32(4, 12, true); // RSA OAEP SHA1 MGF1 SHA1
    view.setUint32(8, 2, true); // AES_CFB128 NOPADDING
    new Uint8Array(handshakePacket).set(new Uint8Array(encryptedKey), 12);

    await this._stream.write(handshakePacket);
  }

  close(): void {
    this._stream.close();
  }
}
