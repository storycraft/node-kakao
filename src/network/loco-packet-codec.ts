/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacket, LocoPacketHeader } from "../packet_old/loco-packet";
import { ChunkedArrayBufferList } from "./chunk/chunked-arraybuffer-list";
import { Stream } from "./stream";

/**
 * Write / Read loco packet to stream
 */
export class LocoPacketCodec {

    private _stream: Stream;

    constructor(stream: Stream) {
        this._stream = stream;
    }

    get stream() {
        return this._stream;
    }

    send(packet: LocoPacket) {
        const packetBuffer = new ArrayBuffer(22 + packet.data[1].byteLength);
        const namebuffer = new ArrayBuffer(11);
        const view = new DataView(packetBuffer);

        view.setUint32(0, packet.header.id, true);
        view.setUint16(4, packet.header.status & 0xffff, true);
        view.setUint8(17, packet.data[0] & 0xff);
        view.setUint32(18, packet.data[1].byteLength, true);

        const nameLen = Math.min(packet.header.method.length, 11);
        const nameView = new DataView(namebuffer);
        for (let i = 0; i < nameLen; i++) {
            const code = packet.header.method.charCodeAt(i);

            if (code > 0xff) throw 'Invalid ASCII code at method string';
            nameView.setUint8(i, code);
        }

        const packetArray = new Uint8Array(packetBuffer);
        packetArray.set(new Uint8Array(namebuffer), 6);
        packetArray.set(new Uint8Array(packet.data[1]), 22);

        this._stream.write(packetBuffer);
    }

    iterate() {
        const instance = this;

        return {
            [Symbol.asyncIterator](): AsyncIterator<LocoPacket> {
                return {
                    async next() {
                        const headerBufferList = new ChunkedArrayBufferList();
                        const packetBufferList = new ChunkedArrayBufferList();
        
                        for await (const data of instance._stream.iterate()) {
                            headerBufferList.append(data);
        
                            if (headerBufferList.byteLength >= 22) break;
                        }
                        if (instance._stream.ended) {
                            return { done: true, value: null };
                        }
        
                        const headerBuffer = headerBufferList.toBuffer();
                        const headerView = new DataView(headerBuffer);
        
                        const header: LocoPacketHeader = {
                            id: headerView.getUint32(0, true),
                            status: headerView.getUint16(4, true),
                            method: String.fromCharCode(...new Uint8Array(headerBuffer.slice(6, 17))).replace(/\0/g, '')
                        };
                        const dataType = headerView.getUint8(17);
                        const dataSize = headerView.getUint32(18, true);
        
                        const headerLeftBuffer = headerBuffer.slice(22);
                        if (headerLeftBuffer.byteLength > 0) {
                            packetBufferList.append(headerLeftBuffer);
                        }
        
                        if (packetBufferList.byteLength < dataSize) {
                            for await (const data of instance._stream.iterate()) {
                                packetBufferList.append(data);
            
                                if (packetBufferList.byteLength >= dataSize) break;
                            }
                        }
                        
                        if (instance._stream.ended) {
                            return { done: true, value: null };
                        }
                        
                        const dataBuffer = packetBufferList.toBuffer();
                        
                        return {
                            done: false,
                            value: {
                                header: header,
                                data: [dataType, dataBuffer]
                            }
                        };
                    }
                };
            }
        };
    }
    
}