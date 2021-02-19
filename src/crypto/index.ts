/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { isNode } from '../util/platform';

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

/**
 * Try to create CryptoStore by platform.
 *
 * @param {string} pubKey
 */
export async function newCryptoStore(pubKey: string): Promise<CryptoStore> {
  if (isNode()) {
    return (await import('./node-crypto-store')).createNodeCrypto(pubKey);
  } else {
    return (await import('./forge-crypto-store')).createForgeCrypto(pubKey);
  }
}
