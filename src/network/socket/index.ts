/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { isBrowser, isDeno, isNode } from '../../util/platform';
import { BiStream } from '../../stream';

export interface NetSocketOptions {

  host: string;
  port: number;

  keepAlive: boolean;

}

/**
 * Create TCP net stream using options.
 * This detect environment automatically.
 *
 * @param {NetSocketOptions} option
 */
export async function createTCPSocket(option: NetSocketOptions): Promise<BiStream> {
  if (isNode()) {
    const { NodeSocket } = await import('./node-net-socket');
    return NodeSocket.connect(option);
  } else if (isDeno()) {
    const { DenoSocket } = await import('./deno-net-socket');
    return DenoSocket.connect(option);
  } else if (isBrowser()) {
    throw new Error('Browser environments are not supported');
  } else {
    throw new Error('Unknown environment');
  }
}

/**
 * Create TCP TLS net stream using options.
 * This detect environment automatically.
 *
 * @param {NetSocketOptions} option
 */
export async function createTLSSocket(option: NetSocketOptions): Promise<BiStream> {
  if (isNode()) {
    const { NodeSocket } = await import('./node-net-socket');
    return NodeSocket.connectTls(option);
  } else if (isDeno()) {
    // TODO
    const { DenoSocket } = await import('./deno-net-socket');
    return DenoSocket.connectTls(option);
  } else if (isBrowser()) {
    throw new Error('Browser environments are not supported');
  } else {
    throw new Error('Unknown environment');
  }
}
