import { LocoRequestPacket } from "./loco-packet-base";

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

    createHeaderBuffer(packet: LocoRequestPacket, bodySize: number) {
        let buffer = Buffer.allocUnsafe(22);

        buffer.writeUInt32LE(this.getNextPacketId(), 0);
        buffer.writeUInt16LE(packet.StatusCode, 4);
        
        let written = buffer.write(packet.PacketName, 6, 'utf8');
        buffer.fill(0, 6 + written, 17);

        buffer.writeInt8(packet.BodyType, 17);
        buffer.writeUInt32LE(bodySize, 18);

        return buffer;
    }

    toBuffer(packet: LocoRequestPacket, buffer?: Buffer, offset = 0): Buffer {
        let bodyBuffer = packet.writeBody();

        let bodySize = bodyBuffer.length;

        let size = 22 + bodySize;

        if (buffer && buffer.length < offset + size) {
            throw new Error(`Provided buffer is smaller than required. Size: ${buffer.length}, Required: ${offset + size}`);
        } else {
            buffer = Buffer.allocUnsafe(size + offset);
        }

        let headerBuffer = this.createHeaderBuffer(packet, bodySize);

        headerBuffer.copy(buffer, offset, 0);
        bodyBuffer.copy(buffer, offset + 22, 0);
        
        return buffer;
    }

}