/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketHeader } from '../packet';
import { ChunkedArrayBufferList } from './chunk';
import { BiStream } from '../stream';

/**
 * Write / Read loco packet to stream
 */
export class LocoPacketCodec {
  private _stream: BiStream;

  constructor(stream: BiStream) {
    this._stream = stream;
  }

  get stream(): BiStream {
    return this._stream;
  }

  send(packet: LocoPacket): Promise<void> {
    const packetBuffer = new ArrayBuffer(22 + packet.data[1].byteLength);
    const packetArray = new Uint8Array(packetBuffer);
    const namebuffer = new Uint8Array(11);
    const view = new DataView(packetBuffer);

    view.setUint32(0, packet.header.id, true);
    view.setUint16(4, packet.header.status & 0xffff, true);
    view.setUint8(17, packet.data[0] & 0xff);
    view.setUint32(18, packet.data[1].byteLength, true);

    const nameLen = Math.min(packet.header.method.length, 11);
    const nameList: number[] = [];
    for (let i = 0; i < nameLen; i++) {
      const code = packet.header.method.charCodeAt(i);

      if (code > 0xff) throw new Error('Invalid ASCII code at method string');
      nameList.push(code);
    }
    namebuffer.set(nameList, 0);

    packetArray.set(namebuffer, 6);
    packetArray.set(packet.data[1], 22);

    return this._stream.write(packetArray);
  }

  iterate(): { [Symbol.asyncIterator](): AsyncIterator<LocoPacket>, next(): Promise<IteratorResult<LocoPacket>> } {
    const stream = this._stream;

    const iterator = stream.iterate();

    const headerBufferList = new ChunkedArrayBufferList();
    const packetBufferList = new ChunkedArrayBufferList();

    return {
      [Symbol.asyncIterator](): AsyncIterator<LocoPacket> {
        return this;
      },

      async next(): Promise<IteratorResult<LocoPacket>> {
        if (stream.ended) {
          return { done: true, value: null };
        }

        if (headerBufferList.byteLength < 22) {
          for await (const data of iterator) {
            headerBufferList.append(data);

            if (headerBufferList.byteLength >= 22) break;
          }

          if (stream.ended) {
            return { done: true, value: null };
          }
        }

        const headerBuffer = headerBufferList.toBuffer();
        const headerArray = new Uint8Array(headerBuffer);
        const headerView = new DataView(headerBuffer);

        const header: LocoPacketHeader = {
          id: headerView.getUint32(0, true),
          status: headerView.getUint16(4, true),
          method: String.fromCharCode(...headerArray.slice(6, 17)).replace(/\0/g, ''),
        };

        const dataType = headerView.getUint8(17);
        const dataSize = headerView.getUint32(18, true);

        if (headerBuffer.byteLength > 22) {
          packetBufferList.append(headerBuffer.slice(22));
        }
        await headerBufferList.clear();

        if (packetBufferList.byteLength < dataSize) {
          for await (const data of iterator) {
            packetBufferList.append(data);

            if (packetBufferList.byteLength >= dataSize) break;
          }

          if (stream.ended && packetBufferList.byteLength < dataSize) {
            return { done: true, value: null };
          }
        }

        const dataBuffer = packetBufferList.toBuffer();
        const data = new Uint8Array(dataBuffer);

        if (dataBuffer.byteLength > dataSize) {
          headerBufferList.append(dataBuffer.slice(dataSize));
        }
        packetBufferList.clear();

        return {
          done: false,
          value: {
            header: header,
            data: [dataType, data.slice(0, dataSize)],
          },
        };
      },
    };
  }
}
