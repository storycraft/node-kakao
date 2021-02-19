/*
 * Created on Wed Feb 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { sha512 } from 'hash-wasm';

export interface XVCProvider {

  toFullXVCKey(deviceUUID: string, userAgent: string, email: string): Promise<string>;

}

export const Win32XVCProvider: XVCProvider = {

  toFullXVCKey(deviceUUID: string, userAgent: string, email: string): Promise<string> {
    const source = `JAYDEN|${userAgent}|JAYMOND|${email}|${deviceUUID}`;
    return sha512(source);
  }

}

export const AndroidSubXVCProvider: XVCProvider = {

  toFullXVCKey(_: string, userAgent: string, email: string): Promise<string> {
    const source = `KOLD|${userAgent}|BRAN|${email}|BRAD`;
    return sha512(source);
  }

}