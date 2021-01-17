/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

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

export interface LocoPacketDataCodec<T> {

    /**
     *  Returns true if codec can decode data with supplied type.
     * @param dataType 
     */
    canDecode(dataType: number): boolean;

    /**
     * Decode packet data buffer to data
     * @param data 
     */
    decode(data: ArrayBuffer): T;

    /**
     * Encode data to packet data
     * @param data 
     */
    encode(data: T): [number, ArrayBuffer];

}