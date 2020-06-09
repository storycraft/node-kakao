import { Transform, TransformCallback } from "stream";
import { LocoSecureSocket } from "../loco-secure-socket";
import { EncryptedPacketHeader } from "../../packet/packet-header-struct";
import { ChunkedBufferList } from "../chunk/chunked-buffer-list";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoEncryptedTransformer extends Transform {

    static readonly ENCRYPTED_HEADER_SIZE: number = 4;
    static readonly IV_SIZE: number = 16;

    private currentEncryptedHeader: EncryptedPacketHeader | null;

    private chunkList: ChunkedBufferList;

    constructor(private socket: LocoSecureSocket) {
        super();
        
        this.currentEncryptedHeader = null;

        this.chunkList = new ChunkedBufferList();
    }

    get Socket() {
        return this.socket;
    }

    get Crypto() {
        return this.socket.Crypto;
    }

    _destroy(error: Error | null, callback: (error: Error | null) => void) {
        this.currentEncryptedHeader = null;
        this.chunkList.clear();

        super._destroy(error, callback);
    }

    _transform(chunk: Buffer, encoding?: string, callback?: TransformCallback) {
        this.chunkList.append(chunk);
        
        let buf: Buffer | null = null;
        if (!this.currentEncryptedHeader && this.chunkList.TotalByteLength > LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE) {
            buf = this.chunkList.toBuffer();
            this.currentEncryptedHeader = { encryptedSize: buf.readInt32LE(0) };
        }

        if (this.currentEncryptedHeader) {
            let encryptedPacketSize = LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + this.currentEncryptedHeader.encryptedSize;

            if (this.chunkList.TotalByteLength >= encryptedPacketSize) {
                if (!buf) buf = this.chunkList.toBuffer();

                let iv = buf.slice(LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE, LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + LocoEncryptedTransformer.IV_SIZE);
                let encryptedBodyBuffer = buf.slice(LocoEncryptedTransformer.ENCRYPTED_HEADER_SIZE + LocoEncryptedTransformer.IV_SIZE, encryptedPacketSize);
                
                let decrypted = this.Crypto.toDecryptedPacketBuffer(encryptedBodyBuffer, iv);

                let newBuf = Buffer.allocUnsafe(buf.byteLength - encryptedPacketSize);

                buf.copy(newBuf, 0, encryptedPacketSize);

                this.chunkList.clear();
                this.currentEncryptedHeader = null;

                this.push(decrypted);

                this._transform(newBuf);
            }
        }

        if (callback)
            callback();
    }

}