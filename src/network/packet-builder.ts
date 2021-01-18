/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketDataCodec } from "../packet_old/loco-packet";
import { PacketIdGenerator } from "./packet-id-generator";

/**
 * Build LocoPacket object from packet data
 */
export class PacketBuilder<T> {

    private _idGenerator: PacketIdGenerator;
    private _dataCodec: LocoPacketDataCodec<T>;

    constructor(dataCodec: LocoPacketDataCodec<T>) {
        this._idGenerator = new PacketIdGenerator();
        this._dataCodec = dataCodec;
    }

    /**
     * Construct LocoPacket with given method and data
     * @param method 
     * @param data 
     */
    construct(method: string, data: T): LocoPacket {
        const packetData = this._dataCodec.encode(data);

        return {
            header: {
                id: this._idGenerator.next(),
                method,
                status: 0,
            },
            data: packetData
        };
    }

}