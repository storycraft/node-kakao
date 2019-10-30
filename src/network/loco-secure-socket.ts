import { LocoSocket } from "./loco-socket";
import { CryptoManager } from "../secure/crypto-manager";
import * as net from "net";
import { LocoEncryptedTransformer } from "./stream/loco-encrypted-transformer";
import { LocoPacketResolver } from "./stream/loco-packet-resolver";
import { LocoRequestPacket } from "../packet/loco-packet-base";

/*
 * Created on Sun Oct 20 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoSecureSocket extends LocoSocket<net.Socket> {

    private crypto: CryptoManager;
    
    private handshaked: boolean;

    constructor(host: string, port: number, keepAlive: boolean) {
        super(host, port, keepAlive);

        this.handshaked = false;

        this.crypto = new CryptoManager();
    }

    get Handshaked() {
        return this.handshaked;
    }

    protected pipeTranformation(socket: net.Socket) {
        socket.pipe(new LocoEncryptedTransformer(this)).pipe(new LocoPacketResolver(this));
    }

    protected structPacketToBuffer(packet: LocoRequestPacket): Buffer {
        let packetBuffer = this.Writer.toBuffer(packet);
        let encryptedPacketBuffer = this.Crypto.toEncryptedPacket(packetBuffer);

        return encryptedPacketBuffer;
    }

    async sendPacket(packet: LocoRequestPacket) {
        if (!this.Connected) {
            return false;
        }

        if (!this.handshaked) {
            await this.sendHandshakePacket();
        }
        
        return super.sendPacket(packet);
    }

    async handshake() {
        if (!this.Connected || this.handshaked) {
            return false;
        }

        return this.sendHandshakePacket();
    }

    protected async sendHandshakePacket() {
        this.handshaked = true;

        let keyBuffer = this.Crypto.getRSAEncryptedKey();

        let handshakeHead = Buffer.allocUnsafe(12);

        handshakeHead.writeUInt32LE(keyBuffer.length, 0);
        handshakeHead.writeUInt32LE(12, 4); // RSA OAEP SHA1 MGF1 SHA1
        handshakeHead.writeUInt32LE(2, 8); // AES_CFB128 NOPADDING

        let handshakeBuffer = Buffer.concat([ handshakeHead, keyBuffer ]);

        return this.sendBuffer(handshakeBuffer);
    }

    protected createSocketConnection(host: string, port: number, callback: () => void): net.Socket {
        this.handshaked = false;

        return net.connect({
            host: host,
            port: port,
            timeout: 15000
        }, callback).setKeepAlive(this.KeepAlive).setNoDelay(true);
    }

    get Crypto() {
        return this.crypto;
    }
    
    protected onEnd(buffer: Buffer): void {

    }

    protected onError(e: any): void {
        console.log('error: ' + e);
    }


}