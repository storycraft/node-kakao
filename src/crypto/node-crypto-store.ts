/*
 * Created on Sat Jan 30 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as crypto from 'crypto';
import { CryptoStore } from '.';

export async function createNodeCrypto(pubKey: string): Promise<CryptoStore> {
  const key = crypto.randomBytes(16);

  const store = {
    toAESEncrypted(buffer: ArrayBuffer, iv: ArrayBuffer) {
      const cipher = crypto.createCipheriv('aes-128-cfb', key, new Uint8Array(iv));

      const encrypted = cipher.update(new Uint8Array(buffer));
      const final = cipher.final();

      const res = new Uint8Array(encrypted.byteLength + final.byteLength);

      res.set(encrypted, 0);
      res.set(final, encrypted.byteLength);

      return res;
    },
    toAESDecrypted(buffer: ArrayBuffer, iv: ArrayBuffer) {
      const cipher = crypto.createDecipheriv('aes-128-cfb', key, new Uint8Array(iv));

      const decrypted = cipher.update(new Uint8Array(buffer));
      const final = cipher.final();

      const res = new Uint8Array(decrypted.byteLength + final.byteLength);

      res.set(decrypted, 0);
      res.set(final, decrypted.byteLength);

      return res;
    },

    toRSAEncrypted(buffer: ArrayBuffer) {
      return crypto.publicEncrypt(pubKey, new Uint8Array(buffer));
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
