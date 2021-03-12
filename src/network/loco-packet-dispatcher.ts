/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket } from '../packet';
import { LocoPacketCodec } from './loco-packet-codec';
import { BiStream } from '../stream';

export interface PacketRes {

  push: boolean,
  packet: LocoPacket

}

export class LocoPacketDispatcher {
  private _codec: LocoPacketCodec;

  private _packetMap: Map<number, [
    resolve: (value: LocoPacket | PromiseLike<LocoPacket>) => void,
    reject: (reason?: unknown) => void
  ]>;

  constructor(stream: BiStream) {
    this._codec = new LocoPacketCodec(stream);
    this._packetMap = new Map();
  }

  get stream(): BiStream {
    return this._codec.stream;
  }

  /**
   * Send packet.
   *
   * @param {LocoPacket} packet
   * @return {Promise<LocoPacket>} response
   */
  async sendPacket(packet: LocoPacket): Promise<LocoPacket> {
    if (this._packetMap.has(packet.header.id)) throw new Error(`Packet#${packet.header.id} can conflict`);

    const promise = new Promise<LocoPacket>((resolve, reject) => {
      this._packetMap.set(packet.header.id, [resolve, reject]);
    });

    await this._codec.write(packet);

    return promise;
  }

  /**
   * Read one packet and process it.
   */
  async read(): Promise<PacketRes | undefined> {
    const packet = await this._codec.read();
    if (!packet) return;

    if (this._packetMap.has(packet.header.id)) {
      const resolver = this._packetMap.get(packet.header.id);
      if (resolver) {
        resolver[0](packet);
        this._packetMap.delete(packet.header.id);
      }
      return { push: false, packet };
    } else {
      return { push: true, packet };
    }
  }

  /**
   * Listen and read incoming packets.
   *
   * @return {AsyncIterableIterator<PacketRes>}
   */
  listen(): AsyncIterableIterator<PacketRes> {
    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async (): Promise<IteratorResult<PacketRes>> => {
        const read = await this.read();

        if (!read) return { done: true, value: null };
        
        return { done: false, value: read };
      },
    };
  }
}
