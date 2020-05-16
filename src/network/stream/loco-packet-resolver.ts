import { Duplex, Writable } from "stream";
import { LocoPacketReader } from "../../packet/loco-packet-reader";
import { LocoSocket } from "../loco-socket";
import { PacketHeader } from "../../packet/packet-header-struct";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketResolver extends Writable {

    static readonly HEADER_SIZE: number = 22;

    private currentHeader: PacketHeader | null;
    private packetBuffer: Buffer;

    constructor(private socket: LocoSocket) {
        super();
        
        this.packetBuffer = Buffer.allocUnsafe(0);
        this.currentHeader = null;
    }

    get Socket() {
        return this.socket;
    }

    _destroy(error: Error | null, callback: (error?: Error | null) => void) {
        this.currentHeader = null;
        this.packetBuffer = Buffer.allocUnsafe(0);

        super._destroy(error, callback);
    }

    _write(chunk: Buffer, encoding?: string, callback?: (e?: Error) => void) {
        this.packetBuffer = Buffer.concat([ this.packetBuffer, chunk ]);

        if (!this.currentHeader && this.packetBuffer.length > LocoPacketResolver.HEADER_SIZE) {
            let headerBuffer = this.packetBuffer.slice(0, LocoPacketResolver.HEADER_SIZE);
            this.currentHeader = this.structHeader(headerBuffer);
        }

        if (this.currentHeader) {
            let currentPacketSize = LocoPacketResolver.HEADER_SIZE + this.currentHeader.bodySize;

            if (this.packetBuffer.length >= currentPacketSize) {
                let bodyBuffer = this.packetBuffer.slice(LocoPacketResolver.HEADER_SIZE, currentPacketSize);

                let newBuf = Buffer.allocUnsafe(this.packetBuffer.length - currentPacketSize);
                this.packetBuffer.copy(newBuf, 0, currentPacketSize);

                this.Socket.dataReceived(this.currentHeader, bodyBuffer);

                this.packetBuffer = Buffer.allocUnsafe(0);
                this.currentHeader = null;

                this._write(newBuf);
            }

        }

        if (callback)
            callback();
    }

    protected structHeader(buffer: Buffer, offset: number = 0): PacketHeader {
        return {
            packetId: buffer.readInt32LE(offset),
            statusCode: buffer.readInt32LE(offset),
            packetName: buffer.toString('utf8', offset + 6, offset + 16).replace(/\0/g, ''),
            bodyType: buffer.readInt8(offset + 17),
            bodySize: buffer.readInt32LE(offset + 18)
        };
    }

}