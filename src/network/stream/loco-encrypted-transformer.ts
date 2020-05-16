import { Transform, TransformCallback } from "stream";
import { LocoSecureSocket } from "../loco-secure-socket";
import { EncryptedPacketHeader } from "../../packet/packet-header-struct";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoEncryptedTransformer extends Transform {

    static readonly ENCRYPTED_HEADER_SIZE: number = 4;
    static readonly IV_SIZE: number = 16;

    private currentEncryptedHeader: EncryptedPacketHeader | null;
    private encryptedBuffer: Buffer;

    constructor(private socket: LocoSecureSocket) {
        super();

        this.encryptedBuffer = Buffer.allocUnsafe(0);
        this.currentEncryptedHeader = null;
    }

    get Socket() {
        return this.socket;
    }

    get Crypto() {
        return this.socket.Crypto;
    }

    _destroy(error: Error | null, callback: (error: Error | null) => void) {
        this.currentEncryptedHeader = null;
        this.encryptedBuffer = Buffer.allocUnsafe(0);

        super._destroy(error, callback);
    }

    _transform(chunk: Buffer, encoding?: string, callback?: TransformCallback) {
        this.encryptedBuffer = Buffer.concat([ this.encryptedBuffer, chunk ]);

        if (!this.currentEncryptedHeader && this.encryptedBuffer.length > LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE) {
            this.currentEncryptedHeader = { encryptedSize: this.encryptedBuffer.readInt32LE(0) };
        }

        if (this.currentEncryptedHeader) {
            let encryptedPacketSize = LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + this.currentEncryptedHeader.encryptedSize;

            if (this.encryptedBuffer.length >= encryptedPacketSize) {
                let iv = this.encryptedBuffer.slice(LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE, LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + LocoEncryptedTransformer.IV_SIZE);
                let encryptedBodyBuffer = this.encryptedBuffer.slice(LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + LocoEncryptedTransformer.IV_SIZE, encryptedPacketSize);
                
                let decrypted = this.Crypto.toDecryptedPacketBuffer(encryptedBodyBuffer, iv);

                let newBuf = Buffer.allocUnsafe(this.encryptedBuffer.length - encryptedPacketSize);

                this.encryptedBuffer.copy(newBuf, 0, encryptedPacketSize);

                this.encryptedBuffer = Buffer.allocUnsafe(0);
                this.currentEncryptedHeader = null;

                this.push(decrypted);

                this._transform(newBuf);
            }
        }

        if (callback)
            callback();
    }

}