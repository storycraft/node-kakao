import { LocoHeaderStruct } from "./loco-header-struct";
import { LocoResponsePacket } from "./loco-packet-base";
import { LocoPacketList } from "./loco-packet-list";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketReader {

    private latestReadPacketId: number;

    constructor() {
        this.latestReadPacketId = -1;
    }

    get LatestReadPacketId() {
        return this.latestReadPacketId;
    }

    structHeader(buffer: Buffer, offset: number = 0): LocoHeaderStruct {
        let header = new LocoHeaderStruct();

        header.PacketId = buffer.readInt32LE(offset);

        header.StatusCode = buffer.readInt16LE(offset + 4);
        
        header.PacketName = buffer.toString('utf8', offset + 6, offset + 16).replace(/\0/g, '');

        header.BodyType = buffer.readInt8(offset + 17);

        header.BodySize = buffer.readInt32LE(offset + 18);

        return header;
    }

    structToPacket(header: LocoHeaderStruct, bodyBuffer: Buffer, offset: number = 0): LocoResponsePacket {
        let bodyBuf = bodyBuffer.slice(offset, offset + header.BodySize);

        let packet = LocoPacketList.getResPacketByName(header.PacketName, header.StatusCode);

        packet.readBody(bodyBuf);

        return packet;
    }

}