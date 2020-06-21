import { Duplex, Writable } from "stream";
import { LocoSocket } from "../loco-socket";
import { PacketHeader } from "../../packet/packet-header-struct";
import { ChunkedBufferList } from "../chunk/chunked-buffer-list";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketResolver extends Writable {

    static readonly HEADER_SIZE: number = 22;

    private currentHeader: PacketHeader | null;
    private chunkList: ChunkedBufferList;

    constructor(private socket: LocoSocket) {
        super();
        
        this.chunkList = new ChunkedBufferList();
        this.currentHeader = null;
    }

    get Socket() {
        return this.socket;
    }

    _destroy(error: Error | null, callback: (error?: Error | null) => void) {
        this.currentHeader = null;
        this.chunkList.clear();

        super._destroy(error, callback);
    }

    _write(chunk: Buffer, encoding?: string, callback?: (e?: Error) => void) {
        this.chunkList.append(chunk);

        let buf: Buffer | null = null;
        if (!this.currentHeader && this.chunkList.TotalByteLength > LocoPacketResolver.HEADER_SIZE) {
            buf = this.chunkList.toBuffer();

            let headerBuffer = buf.slice(0, LocoPacketResolver.HEADER_SIZE);
            this.currentHeader = this.structHeader(headerBuffer);
        }

        if (this.currentHeader) {
            let currentPacketSize = LocoPacketResolver.HEADER_SIZE + this.currentHeader.bodySize;

            if (this.chunkList.TotalByteLength >= currentPacketSize) {
                if (!buf) buf = this.chunkList.toBuffer();

                let newBuf = Buffer.allocUnsafe(buf.byteLength - currentPacketSize);
                buf.copy(newBuf, 0, currentPacketSize);

                let bodyBuffer = buf.slice(LocoPacketResolver.HEADER_SIZE, currentPacketSize);
                this.Socket.dataReceived(this.currentHeader, bodyBuffer);

                this.chunkList.clear();
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
            statusCode: buffer.readInt16LE(offset + 4),
            packetName: buffer.toString('utf8', offset + 6, offset + 17).replace(/\0/g, ''),
            bodyType: buffer.readInt8(offset + 17),
            bodySize: buffer.readInt32LE(offset + 18)
        };
    }

}