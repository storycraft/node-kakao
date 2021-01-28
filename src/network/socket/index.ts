/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { isBrowser, isDeno, isNode } from "../../util/platform";
import { Stream } from "../stream";

export interface NetSocketOptions {

    host: string;
    port: number;

    keepAlive: boolean;

}


/**
 * Create TCP net stream using options.
 * This detect environment automatically.
 */
export async function createTCPSocket(option: NetSocketOptions): Promise<Stream> {
    if (isNode()) {
        const { NodeSocket } = await import('./node-net-socket');
        return NodeSocket.connect(option);
    } else if (isDeno()) {
        throw new Error('Deno runtime is not implemented yet.');
    } else if (isBrowser()) {
        throw new Error('Browser environments are not supported');
    } else {
        throw new Error('Unknown environment');
    }

}

/**
 * Create TCP TLS net stream using options.
 * This detect environment automatically.
 */
export async function createTLSSocket(option: NetSocketOptions): Promise<Stream> {
    if (isNode()) {
        const { NodeSocket } = await import('./node-net-socket');
        return NodeSocket.connectTls(option);
    } else if (isDeno()) {
        throw new Error('Deno runtime is not implemented yet.');
    } else if (isBrowser()) {
        throw new Error('Browser environments are not supported');
    } else {
        throw new Error('Unknown environment');
    }
}