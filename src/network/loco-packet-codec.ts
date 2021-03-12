/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketHeader } from '../packet';
import { BiStream, ReadStreamUtil } from '../stream';

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

  write(packet: LocoPacket): Promise<number> {
    const packetBuffer = new ArrayBuffer(22 + packet.data[1].byteLength);
    const packetArray = new Uint8Array(packetBuffer);
    const view = new DataView(packetBuffer);

    view.setUint32(0, packet.header.id, true);
    view.setUint16(4, packet.header.status & 0xffff, true);

    for (let i = 0; i < 11; i++) {
      const code = packet.header.method.charCodeAt(i) || 0;

      if (code > 0xff) throw new Error('Invalid ASCII code at method string');
      packetArray[6 + i] = code;
    }

    view.setUint8(17, packet.data[0] & 0xff);
    view.setUint32(18, packet.data[1].byteLength, true);

    packetArray.set(packet.data[1], 22);

    return this._stream.write(packetArray);
  }

  async read(): Promise<LocoPacket | undefined> {
    const headerArray = await ReadStreamUtil.exact(this._stream, 22);
    if (!headerArray) return;

    const headerView = new DataView(headerArray.buffer);

    const header: LocoPacketHeader = {
      id: headerView.getUint32(0, true),
      status: headerView.getUint16(4, true),
      method: String.fromCharCode(...headerArray.subarray(6, 17)).replace(/\0/g, ''),
    };

    const dataType = headerView.getUint8(17);
    const dataSize = headerView.getUint32(18, true);

    const data = await ReadStreamUtil.exact(this._stream, dataSize);
    if (!data) return;

    return {
      header: header,
      data: [dataType, data],
    };
  }
}
