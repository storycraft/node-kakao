/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from "./booking";
export * from "./bson-data-codec";
export * from "./chat";
export * from "./checkin";
export * from "./status-code";
export * from "./struct";

export interface LocoPacket {

    /**
     * Packet header
     */
    header: LocoPacketHeader;

    /**
     * [dataType, data buffer]
     */
    data: [number, ArrayBuffer];

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
    decode(data: ArrayBuffer): R;

    /**
     * Encode data to packet data
     * @param data
     */
    encode(data: T): [number, ArrayBuffer];

}