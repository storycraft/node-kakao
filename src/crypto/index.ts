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

  toAESEncrypted(buffer: Uint8Array, iv: Uint8Array): Uint8Array;
  toAESDecrypted(buffer: Uint8Array, iv: Uint8Array): Uint8Array;

  toRSAEncrypted(buffer: Uint8Array): Uint8Array;

  randomCipherIV(): Uint8Array;

  getRSAEncryptedKey(): Uint8Array;

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
