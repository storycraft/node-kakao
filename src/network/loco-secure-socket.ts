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

    protected transformBuffer(data: Buffer): Buffer {
        if (this.handshaked) {
            let encryptedPacketBuffer = this.Crypto.toEncryptedPacket(super.transformBuffer(data), this.crypto.randomCipherIV());

            return encryptedPacketBuffer;
        }

        return super.transformBuffer(data);
    }

    async handshake() {
        if (!this.Connected || this.handshaked) {
            return false;
        }

        return this.sendHandshakePacket();
    }

    protected async sendHandshakePacket() {
        let keyBuffer = this.Crypto.getRSAEncryptedKey();

        let handshakeHead = Buffer.allocUnsafe(12);

        handshakeHead.writeUInt32LE(keyBuffer.length, 0);
        handshakeHead.writeUInt32LE(12, 4); // RSA OAEP SHA1 MGF1 SHA1
        handshakeHead.writeUInt32LE(2, 8); // AES_CFB128 NOPADDING

        let handshakeBuffer = Buffer.concat([ handshakeHead, keyBuffer ]);

        let res = await super.sendBuffer(handshakeBuffer);

        return this.handshaked = res;
    }

    protected createSocketConnection(host: string, port: number, callback: () => void): net.Socket {
        this.handshaked = false;

        return net.connect({
            host: host,
            port: port,
            timeout: 15000
        }, callback).setKeepAlive(this.KeepAlive).setNoDelay(true);
    }

    async sendBuffer(buffer: Buffer): Promise<boolean> {
        if (!this.Connected) return false;

        if (!this.handshaked) await this.handshake();

        return super.sendBuffer(buffer);
    }

    get Crypto() {
        return this.crypto;
    }

    protected onConnect() {
        
    }

    protected onConnected() {
        
    }
    
    protected onEnd(buffer: Buffer): void {
        
    }

    protected onError(e: any): void {
        throw e;
    }


}