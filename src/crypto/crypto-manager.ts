import * as crypto from "crypto";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class CryptoManager {

    private key: Buffer;

    constructor(private pubKey: string, key: Buffer = crypto.randomBytes(16)) {
        this.key = key;
    }

    get Key() {
        return this.key;
    }

    get PEMPublicKey(): string {
        return this.pubKey;
    }

    protected bufferToBinaryString(buffer: Buffer): string {
        return buffer.toString('binary');
    }

    protected binaryStringToBuffer(str: string): Buffer {
        return Buffer.from(str, 'binary');
    }

    toAESEncrypted(buffer: Buffer, iv: Buffer): Buffer {
        let cipher = crypto.createCipheriv('aes-128-cfb', this.key, iv);

        return Buffer.concat([ cipher.update(buffer), cipher.final() ]);
    }

    toAESDecrypted(buffer: Buffer, iv: Buffer): Buffer {
        let cipher = crypto.createDecipheriv('aes-128-cfb', this.key, iv);
        
        return Buffer.concat([ cipher.update(buffer), cipher.final() ]);
    }

    toRSAEncrypted(buffer: Buffer): Buffer {
        return crypto.publicEncrypt(this.PEMPublicKey, buffer);
    }

    toEncryptedPacket(packetBuffer: Buffer, cipherIV: Buffer): Buffer {
        let encryptedBuf = this.toAESEncrypted(packetBuffer, cipherIV);

        let buffer = Buffer.allocUnsafe(encryptedBuf.byteLength + 20);

        buffer.writeUInt32LE(encryptedBuf.length + 16, 0);
        cipherIV.copy(buffer, 4);
        encryptedBuf.copy(buffer, 20);

        return buffer;
    }

    randomCipherIV(): Buffer {
        return crypto.randomBytes(16);
    }

    toDecryptedPacketBuffer(encryptedPacketBuffer: Buffer, cipherIV: Buffer): Buffer {
        return this.toAESDecrypted(encryptedPacketBuffer, cipherIV);
    }

    getRSAEncryptedKey(): Buffer {
        return this.toRSAEncrypted(this.key);
    }

}