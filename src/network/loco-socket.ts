import { LocoPacketWriter } from "../packet/loco-packet-writer";
import { LocoPacketReader } from "../packet/loco-packet-reader";
import * as net from "net";
import { EventEmitter } from "events";
import { LocoResponsePacket, LocoRequestPacket } from "../packet/loco-packet-base";
import { LocoPacketResolver } from "./stream/loco-packet-resolver";

/*
 * Created on Sun Oct 20 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class LocoSocket<T extends net.Socket> extends EventEmitter {

    private socket: T | null;

    private host: string;
    private port: number;

    private connected: boolean;

    private keepAlive: boolean;

    private packetWriter: LocoPacketWriter;
    private packetReader: LocoPacketReader;

    private packetMap: Map<number, LocoRequestPacket>;

    constructor(host: string, port: number, keepAlive: boolean = false, packetWriter: LocoPacketWriter = new LocoPacketWriter(), packetReader: LocoPacketReader = new LocoPacketReader()) {
        super();

        this.packetMap = new Map();
        
        this.host = host;
        this.port = port;

        this.socket = null;

        this.packetWriter = packetWriter;
        this.packetReader = packetReader;

        this.connected = false;

        this.keepAlive = keepAlive;
    }

    protected abstract createSocketConnection(host: string, port: number, callback: () => void): T;

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

    get Writer() {
        return this.packetWriter;
    }

    get Reader() {
        return this.packetReader;
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
            this.packetMap.clear();

            this.socket = this.createSocketConnection(this.host, this.port, resolve);
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

    protected onConnect() {

    }

    protected onConnected() {

    }

    disconnect(): boolean {
        if (!this.connected) {
            return false;
        }

        this.onDisconnect();

        this.socket!.destroy();
        this.packetMap.clear();

        this.connected = false;

        this.onDisconnected();

        return true;
    }

    protected onDisconnect() {

    }

    protected onDisconnected() {
        this.emit('disconnected');
    }

    protected connectionError(e: any) {
        this.onError(e);
        this.disconnect();
    }

    protected connectionEnded(buffer: Buffer) {
        this.onEnd(buffer);

        this.disconnect();
    }

    packetReceived(packetId: number, packet: LocoResponsePacket) {
        if (this.packetMap.has(packetId)) {
            let requestPacket = this.packetMap.get(packetId)!;

            this.packetMap.delete(packetId);

            requestPacket.onResponse(packet);

            this.emit('packet', packetId, packet, requestPacket);
        } else {
            this.emit('packet', packetId, packet);
        }

        if (!this.keepAlive) {
            this.disconnect();
        }
    }

    protected structPacketToBuffer(packet: LocoRequestPacket): Buffer {
        return this.Writer.toBuffer(packet);
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        if (!this.connected) {
            return false;
        }

        let buffer = this.structPacketToBuffer(packet);
        this.packetMap.set(this.Writer.CurrentPacketId, packet);

        return this.sendBuffer(buffer);
    }

    async sendBuffer(buffer: Buffer): Promise<boolean> {
        if (!this.connected) {
            return false;
        }
        
        return new Promise<boolean>((resolve, reject) => this.socket!.write(buffer, (e) => {
            if (e) {
                reject(e);
            } else {
                resolve(true);
            }
        }));
    }

    protected abstract onEnd(buffer: Buffer): void;

    protected abstract onError(e: any): void;

    on(event: 'packet' | string, listener: (packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket) => void): this;
    on(event: 'disconnected' | string, listener: () => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once(event: 'packet' | string, listener: (packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket) => void): this;
    once(event: 'disconnected' | string, listener: () => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}
