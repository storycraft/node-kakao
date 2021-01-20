/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Stream } from "../stream";
import { NodeSocket } from "./node-net-socket";

export interface NetSocketOptions {

    host: string;
    port: number;

    keepAlive: boolean;

}

declare var process: any;
declare var Deno: any;
declare var navigator: any;


/**
 * Create TCP net stream using options.
 * This detect environment automatically.
 */
export function createTCPSocket(option: NetSocketOptions): Promise<Stream> {
    if (process && process.release && process.release.name === 'node') {
        return NodeSocket.connect(option);
    } else if (Deno && Deno.connect !== undefined) {
        throw 'Deno runtime is not implemented yet.';
    } else if (navigator && navigator.userAgent) {
        throw 'Browser environments are not supported';
    } else {
        throw 'Unknown environment';
    }

}

/**
 * Create TCP TLS net stream using options.
 * This detect environment automatically.
 */
export function createTLSSocket(option: NetSocketOptions): Promise<Stream> {
    if (process && process.release && process.release.name === 'node') {
        return NodeSocket.connectTls(option);
    } else if (Deno && Deno.connectTls !== undefined) {
        throw 'Deno runtime is not implemented yet.';
    } else if (navigator && navigator.userAgent) {
        throw 'Browser environments are not supported';
    } else {
        throw 'Unknown environment';
    }
}