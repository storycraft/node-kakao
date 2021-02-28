/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * as booking from './booking';
export * from './bson-data-codec';
export * as chat from './chat';
export * as checkin from './checkin';
export * as struct from './struct';

export interface LocoPacket {

  /**
   * Packet header
   */
  header: LocoPacketHeader;

  /**
   * [dataType, data buffer]
   */
  data: [number, Uint8Array];

}

export interface LocoPacketHeader {

  id: number;
  status: number;
  method: string;

}

export interface LocoPacketDataCodec<T, R = T> {

  /**
   * @param dataType
   *
   * @returns true if codec can decode data with supplied type.
   */
  canDecode(dataType: number): boolean;

  /**
   * Decode packet data buffer to data
   * @param data
   */
  decode(data: Uint8Array): R;

  /**
   * Encode data to packet data
   * @param data
   */
  encode(data: T): [number, Uint8Array];

}
