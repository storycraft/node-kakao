/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as crypto from 'crypto';

/**
 * Stores keys and implement cipher / decipher
 */
export interface CryptoStore {

    toAESEncrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer;
    toAESDecrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer;

    toRSAEncrypted(buffer: ArrayBuffer): ArrayBuffer;
    
    randomCipherIV(): ArrayBuffer;

    getRSAEncryptedKey(): ArrayBuffer;

}

export function newCryptoStore(pubKey: string): CryptoStore {
    const key = crypto.randomBytes(16);

    return {
        toAESEncrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer {
            const cipher = crypto.createCipheriv('aes-128-cfb', key, new Uint8Array(iv));

            const encrypted = cipher.update(new Uint8Array(buffer));
            const final = cipher.final();

            const res = new Uint8Array(encrypted.byteOffset + final.byteLength);

            res.set(encrypted, 0);
            res.set(final, encrypted.byteOffset);

            return res;
        },
        toAESDecrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer {
            const cipher = crypto.createDecipheriv('aes-128-cfb', key, new Uint8Array(iv));

            const decrypted = cipher.update(new Uint8Array(buffer));
            const final = cipher.final();

            const res = new Uint8Array(decrypted.byteOffset + final.byteLength);

            res.set(decrypted, 0);
            res.set(final, decrypted.byteOffset);

            return res;
        },

        toRSAEncrypted(buffer: ArrayBuffer): ArrayBuffer {
            return crypto.publicEncrypt(pubKey, new Uint8Array(buffer));
        },

        randomCipherIV(): ArrayBuffer {
            return crypto.randomBytes(16);
        },

        getRSAEncryptedKey(): ArrayBuffer {
            return crypto.publicEncrypt(pubKey, new Uint8Array(key));
        }
    }
}