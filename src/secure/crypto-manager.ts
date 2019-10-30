import * as crypto from "crypto";
import { KakaoAPI } from "../kakao-api";
import * as Forge from "node-forge";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class CryptoManager {

    private key: Buffer;

    private packetCipherIV: Buffer;

    constructor(key: Buffer = crypto.randomBytes(16), packetCipherIV: Buffer = crypto.randomBytes(16)) {
        this.key = key;
        this.packetCipherIV = packetCipherIV;
    }

    get Key() {
        return this.key;
    }

    get PacketCipherIV() {
        return this.packetCipherIV;
    }

    get PEMPublicKey(): string {
        return KakaoAPI.LocoPEMPublicKey;
    }

    protected bufferToBinaryString(buffer: Buffer): string {
        return buffer.toString('binary');
    }

    protected binaryStringToBuffer(str: string): Buffer {
        return Buffer.from(str, 'binary');
    }

    toAESEncrypted(buffer: Buffer, iv: Buffer): Buffer {
        let cipher = Forge.cipher.createCipher('AES-CFB', this.bufferToBinaryString(this.key));

        cipher.start({
            iv: Forge.util.createBuffer(iv)
        });

        cipher.update(Forge.util.createBuffer(buffer));
        cipher.finish();

        return this.binaryStringToBuffer(cipher.output.data);
    }

    toAESDecrypted(buffer: Buffer, iv: Buffer): Buffer {
        let cipher = Forge.cipher.createDecipher('AES-CFB', this.bufferToBinaryString(this.key));

        cipher.start({
            iv: Forge.util.createBuffer(iv)
        });

        cipher.update(Forge.util.createBuffer(buffer));
        cipher.finish();

        return this.binaryStringToBuffer(cipher.output.data);
    }

    toRSAEncrypted(buffer: Buffer): Buffer {
        let publicKey = Forge.pki.publicKeyFromPem(this.PEMPublicKey) as Forge.pki.rsa.PublicKey;

        let encrypted: string = publicKey.encrypt(this.bufferToBinaryString(buffer), "RSA-OAEP", {
            md: Forge.md.sha1.create(),
            mgf: Forge.mgf.mgf1.create(Forge.md.sha1.create()),
        });

        let encryptedBuffer = this.binaryStringToBuffer(encrypted);

        return encryptedBuffer;
    }

    toEncryptedPacket(packetBuffer: Buffer): Buffer {
        let encryptedBuf = this.toAESEncrypted(packetBuffer, this.packetCipherIV);

        let buffer = Buffer.allocUnsafe(encryptedBuf.length + 20);

        buffer.writeUInt32LE(encryptedBuf.length + 16, 0);
        this.packetCipherIV.copy(buffer, 4);
        encryptedBuf.copy(buffer, 20);

        return buffer;
    }

    toDecryptedPacketBuffer(encryptedPacketBuffer: Buffer): Buffer {
        let decryptedBuffer = this.toAESDecrypted(encryptedPacketBuffer, this.packetCipherIV);

        return decryptedBuffer;
    }

    getRSAEncryptedKey(): Buffer {
        return this.toRSAEncrypted(this.key);
    }

}