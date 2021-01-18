import * as net from "net";
import { LocoPacketResolver } from "./stream/loco-packet-resolver";
import { PacketHeader } from "../packet_old/packet-header-struct";
import { LocoReceiver } from "../loco/loco-interface";

/*
 * Created on Sun Oct 20 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LocoSocket {

    readonly Host: string;
    readonly Port: number;

    readonly Connected: boolean;
    readonly KeepAlive: boolean;

    connect(): Promise<boolean>;
    disconnect(): boolean;

    sendPacket(header: PacketHeader, data: Buffer): Promise<boolean>;
    dataReceived(header: PacketHeader, data: Buffer): void;

}

export abstract class LocoBasicSocket implements LocoSocket {

    private socket: net.Socket | null;

    private connected: boolean;

    constructor(private receiver: LocoReceiver, private host: string, private port: number, private keepAlive: boolean = false) {
        this.socket = null;

        this.connected = false;
    }

    protected abstract createSocketConnection(host: string, port: number, callback: () => void): net.Socket;

    get Host() {
        return this.host;
    }

    get Port() {
        return this.port;
    }

    get Socket() {
        return this.socket;
    }

    get Connected() {
        return this.connected;
    }

    get KeepAlive() {
        return this.keepAlive;
    }

    set KeepAlive(flag) {
        this.keepAlive = flag;
    }

    async connect(): Promise<boolean> {
        if (this.connected) {
            return false;
        }

        await new Promise((resolve, reject) => {
            this.socket = this.createSocketConnection(this.host, this.port, () => resolve);
            this.pipeTranformation(this.socket);

            this.socket.on('error', this.connectionError.bind(this));
            this.socket.on('end', this.connectionEnded.bind(this));

            this.onConnect();
        });
        this.connected = true;

        this.onConnected();

        return true;
    }

    protected pipeTranformation(socket: net.Socket) {
        socket.pipe(new LocoPacketResolver(this));
    }

    protected abstract onConnect(): void;
    protected abstract onConnected(): void;

    disconnect(): boolean {
        if (!this.connected) {
            return false;
        }

        this.onDisconnect();

        this.socket!.destroy();
        this.socket = null;

        this.connected = false;

        this.onDisconnected();

        return true;
    }

    protected onDisconnect() {

    }

    protected onDisconnected() {
        this.receiver.disconnected();
    }

    protected connectionError(e: any) {
        this.onError(e);
        this.disconnect();
    }

    protected connectionEnded(buffer: Buffer) {
        this.onEnd(buffer);

        this.disconnect();
    }

    dataReceived(header: PacketHeader, data: Buffer) {
        try {
            this.receiver.responseReceived(header, data);

            if (!this.keepAlive) {
                this.disconnect();
            }
        } catch (err) {
            this.onError(err);
        }
    }

    protected transformBuffer(data: Buffer): Buffer {
        return data;
    }

    async sendPacket(header: PacketHeader, bodyBuffer: Buffer): Promise<boolean> {
        if (!this.connected) return false;

        return this.sendBuffer(this.toPacketBuffer(header, bodyBuffer));
    }

    async sendBuffer(buffer: Buffer): Promise<boolean> {
        if (!this.connected) {
            return false;
        }

        return new Promise<boolean>((resolve, reject) => this.socket!.write(this.transformBuffer(buffer), (e) => {
            if (e) {
                reject(e);
            } else {
                resolve(true);
            }
        }));
    }

    protected toPacketBuffer(header: PacketHeader, bodyBuffer: Buffer, buffer?: Buffer, offset = 0): Buffer {
        header.bodySize = bodyBuffer.byteLength;

        let size = 22 + header.bodySize;

        if (buffer && buffer.length < offset + size) {
            throw new Error(`Provided buffer is smaller than required. Size: ${buffer.length}, Required: ${offset + size}`);
        } else {
            buffer = Buffer.allocUnsafe(size + offset);
        }

        let headerBuffer = this.createHeaderBuffer(header);

        if (!Buffer.isBuffer(bodyBuffer)) {
            bodyBuffer = Buffer.from(bodyBuffer);
        }

        headerBuffer.copy(buffer, offset, 0);
        bodyBuffer.copy(buffer, offset + 22, 0);
        
        return buffer;
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

    protected abstract onEnd(buffer: Buffer): void;

    protected onError(err: Error) {
        this.receiver.onError(err);
    }

}
