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

    await this._codec.send(packet);

    return promise;
  }

  /**
   * Listen and process incoming packets.
   *
   * @return {AsyncIterableIterator<PacketRes>}
   */
  listen(): AsyncIterableIterator<PacketRes> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const instance = this;
    const iterator = this._codec.iterate();

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      async next(): Promise<IteratorResult<PacketRes>> {
        const next = await iterator.next();

        if (next.done) return { done: true, value: null };

        const packet = next.value;

        if (instance._packetMap.has(packet.header.id)) {
          const resolver = instance._packetMap.get(packet.header.id);
          if (resolver) {
            resolver[0](packet);
            instance._packetMap.delete(packet.header.id);
          }
          return { done: false, value: { push: false, packet } };
        } else {
          return { done: false, value: { push: true, packet } };
        }
      },
    };
  }
}
