/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketDataCodec } from '../packet';

/**
 * Construct LocoPacket object from packet data.
 * Deconstruct LocoPacket into packet data.
 */
export class PacketAssembler<T, R> {
  private _currentId: number;
  private _dataCodec: LocoPacketDataCodec<T, R>;

  constructor(dataCodec: LocoPacketDataCodec<T, R>) {
    this._currentId = 1;
    this._dataCodec = dataCodec;
  }

  /**
   * Construct LocoPacket with given method and data
   *
   * @param {string} method
   * @param {T} data
   * @return {LocoPacket}
   */
  construct(method: string, data: T): LocoPacket {
    const packetData = this._dataCodec.encode(data);

    return {
      header: {
        id: (this._currentId = (this._currentId + 1) % 100000),
        method,
        status: 0,
      },
      data: packetData,
    };
  }

  /**
   * Deconstruct LocoPacket into data.
   * This method can throw error if the type is not supported by codec.
   *
   * @template R
   * @param {LocoPacket} packet
   * @return {R}
   */
  deconstruct(packet: LocoPacket): R {
    if (!this._dataCodec.canDecode(packet.data[0])) throw new Error(`Cannot decode dataType ${packet.data[0]}`);

    return this._dataCodec.decode(packet.data[1]);
  }
}
