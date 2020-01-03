import { Duplex, Writable } from "stream";
import { LocoPacketReader } from "../../packet/loco-packet-reader";
import { LocoSocket } from "../loco-socket";
import { LocoHeaderStruct } from "../../packet/loco-header-struct";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketResolver extends Writable {

    static readonly HEADER_SIZE: number = 22;

    private currentHeader: LocoHeaderStruct | null;
    private packetBuffer: Buffer;

    constructor(private socket: LocoSocket<any>) {
        super();
        
        this.packetBuffer = Buffer.allocUnsafe(0);
        this.currentHeader = null;
    }

    get Socket() {
        return this.socket;
    }

    _write(chunk: Buffer, encoding?: string, callback?: (e?: Error) => void) {
        this.packetBuffer = Buffer.concat([ this.packetBuffer, chunk ]);

        if (!this.currentHeader && this.packetBuffer.length > LocoPacketResolver.HEADER_SIZE) {
            let headerBuffer = this.packetBuffer.slice(0, LocoPacketResolver.HEADER_SIZE);
            this.currentHeader = this.socket.Reader.structHeader(headerBuffer);
        }

        if (this.currentHeader) {
            let currentPacketSize = LocoPacketResolver.HEADER_SIZE + this.currentHeader.BodySize;

            if (this.packetBuffer.length >= currentPacketSize) {
                let bodyBuffer = this.packetBuffer.slice(LocoPacketResolver.HEADER_SIZE, currentPacketSize);

                let newBuf = Buffer.allocUnsafe(this.packetBuffer.length - currentPacketSize);
                this.packetBuffer.copy(newBuf, 0, currentPacketSize);

                try {
                    let packet = this.socket.Reader.structToPacket(this.currentHeader!, bodyBuffer);

                    this.Socket.packetReceived(this.currentHeader!.PacketId, packet);
                } catch(e) {
                    console.log(`Invalid Packet read error: ${e}`);
                }

                this.packetBuffer = Buffer.allocUnsafe(0);
                this.currentHeader = null;

                this._write(newBuf);
            }

        }

        if (callback)
            callback();
    }

}