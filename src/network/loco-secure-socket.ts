import { LocoBasicSocket } from "./loco-socket";
import { CryptoManager } from "../secure/crypto-manager";
import * as net from "net";
import { LocoEncryptedTransformer } from "./stream/loco-encrypted-transformer";
import { LocoPacketResolver } from "./stream/loco-packet-resolver";
import { LocoReceiver } from "../loco/loco-interface";
import { PacketHeader } from "../packet/packet-header-struct";

/*
 * Created on Sun Oct 20 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoSecureSocket extends LocoBasicSocket {

    private crypto: CryptoManager;
    
    private handshaked: boolean;

    constructor(receiver: LocoReceiver, host: string, port: number, keepAlive: boolean) {
        super(receiver, host, port, keepAlive);

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

        let handshakeBuffer = Buffer.allocUnsafe(12 + keyBuffer.byteLength);

        handshakeBuffer.writeUInt32LE(keyBuffer.length, 0);
        handshakeBuffer.writeUInt32LE(12, 4); // RSA OAEP SHA1 MGF1 SHA1
        handshakeBuffer.writeUInt32LE(2, 8); // AES_CFB128 NOPADDING

        keyBuffer.copy(handshakeBuffer, 12);

        let res = await super.sendRawBuffer(handshakeBuffer);

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

    async sendPacket(header: PacketHeader, bodyBuffer: Buffer): Promise<boolean> {
        if (!this.Connected) return false;

        if (!this.handshaked) await this.handshake();

        return super.sendPacket(header, bodyBuffer);
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