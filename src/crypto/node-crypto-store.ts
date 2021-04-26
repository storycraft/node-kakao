/*
 * Created on Sat Jan 30 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as crypto from 'crypto';
import { CryptoStore } from '.';

export async function createNodeCrypto(pubKey: string): Promise<CryptoStore> {
  const key = crypto.randomBytes(16);

  const store = {
    toAESEncrypted(buffer: Uint8Array, iv: Uint8Array) {
      const cipher = crypto.createCipheriv('aes-128-cfb', key, iv);

      const encrypted = cipher.update(buffer);
      const final = cipher.final();

      const res = new Uint8Array(encrypted.byteLength + final.byteLength);

      res.set(encrypted, 0);
      res.set(final, encrypted.byteLength);

      return res;
    },
    toAESDecrypted(buffer: Uint8Array, iv: Uint8Array) {
      const cipher = crypto.createDecipheriv('aes-128-cfb', key, iv);

      const decrypted = cipher.update(buffer);
      const final = cipher.final();

      const res = new Uint8Array(decrypted.byteLength + final.byteLength);

      res.set(decrypted, 0);
      res.set(final, decrypted.byteLength);

      return res;
    },

    toRSAEncrypted(buffer: Uint8Array) {
      return crypto.publicEncrypt(pubKey, buffer);
    },

    randomCipherIV() {
      return crypto.randomBytes(16);
    },

    getRSAEncryptedKey() {
      return this.toRSAEncrypted(key);
    },
  };

  return store;
}
