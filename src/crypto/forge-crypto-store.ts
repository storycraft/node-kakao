/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as forge from 'node-forge';
import { CryptoStore } from '.';

export async function createForgeCrypto(pubKey: string): Promise<CryptoStore> {
  const publicKey = forge.pki.publicKeyFromPem(pubKey);

  const key = forge.random.getBytesSync(16);

  return {
    toAESEncrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer {
      const cipher = forge.cipher.createCipher('AES-CFB', key);

      cipher.start({ iv: forge.util.binary.raw.encode(new Uint8Array(iv)) });

      cipher.update(new forge.util.ByteStringBuffer(buffer));
      cipher.finish();

      const array = forge.util.binary.raw.decode(cipher.output.data);
      return array.buffer;
    },
    toAESDecrypted(buffer: ArrayBuffer, iv: ArrayBuffer): ArrayBuffer {
      const cipher = forge.cipher.createDecipher('AES-CFB', key);

      cipher.start({ iv: forge.util.binary.raw.encode(new Uint8Array(iv)) });

      cipher.update(new forge.util.ByteStringBuffer(buffer));

      const array = forge.util.binary.raw.decode(cipher.output.data);
      return array.buffer;
    },

    toRSAEncrypted(buffer: ArrayBuffer): ArrayBuffer {
      const encrypted = publicKey.encrypt(new forge.util.ByteStringBuffer(buffer).data, 'RSA-OAEP');
      return forge.util.binary.raw.decode(encrypted);
    },

    randomCipherIV(): ArrayBuffer {
      const buffer = new ArrayBuffer(16);
      forge.util.binary.raw.decode(forge.random.getBytesSync(16), new Uint8Array(buffer));

      return buffer;
    },

    getRSAEncryptedKey(): ArrayBuffer {
      const encrypted = publicKey.encrypt(new forge.util.ByteStringBuffer(key).data, 'RSA-OAEP');
      return forge.util.binary.raw.decode(encrypted);
    },
  };
}
