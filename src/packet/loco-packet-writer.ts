import { LocoRequestPacket } from "./loco-packet-base";
import { PacketHeader } from "./packet-header-struct";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketWriter {

    private packetCount: number;

    constructor() {
        this.packetCount = 0;
    }

    get CurrentPacketId() {
        return this.packetCount;
    }

    set CurrentPacketId(value) {
        this.packetCount = value;
    }

    getNextPacketId() {
        return ++this.packetCount;
    }

    protected createHeaderBuffer(header: PacketHeader) {
        let buffer = Buffer.allocUnsafe(22);

        buffer.writeUInt32LE(header.packetId, 0);
        buffer.writeUInt16LE(header.statusCode, 4);
        
        let written = buffer.write(header.packetName, 6, 'utf8');
        buffer.fill(0, 6 + written, 17);

        buffer.writeInt8(header.bodyType, 17);
        buffer.writeUInt32LE(header.bodySize, 18);

        return buffer;
    }

    toBuffer(header: PacketHeader, packet: LocoRequestPacket, buffer?: Buffer, offset = 0): Buffer {
        let bodyBuffer = packet.writeBody();

        header.bodySize = bodyBuffer.byteLength;

        let size = 22 + header.bodySize;

        if (buffer && buffer.length < offset + size) {
            throw new Error(`Provided buffer is smaller than required. Size: ${buffer.length}, Required: ${offset + size}`);
        } else {
            buffer = Buffer.allocUnsafe(size + offset);
        }

        let headerBuffer = this.createHeaderBuffer(header);

        headerBuffer.copy(buffer, offset, 0);
        bodyBuffer.copy(buffer, offset + 22, 0);
        
        return buffer;
    }

}