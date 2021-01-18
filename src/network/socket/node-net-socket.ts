/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Stream } from "../stream";
import * as net from 'net';
import * as tls from 'tls';
import { NetSocketOptions } from "./net-socket-options";

export class NodeSocket implements Stream {

    private _socket: net.Socket;

    private _ended: boolean;
    private _err: any | null;

    private constructor(socket: net.Socket) {
        this._socket = socket;
        this._ended = false;
        this._err = null;

        this._socket.on('error', (err) => this.onError(err));
        this._socket.on('end', () => this.onEnd());
    }

    iterate() {
        const instance = this;

        return {
            [Symbol.asyncIterator](): AsyncIterator<ArrayBuffer> {
                return this;
            },

            next(): Promise<IteratorResult<ArrayBuffer>> {
                return new Promise((resolve, reject) => {
                    if (instance._err) {
                        reject(instance._err);
                        return;
                    }
                    
                    const errHandler = (err: any) => {
                        reject(err);
                    };

                    const endHandler = () => {
                        resolve({ done: true, value: null });
                    };

                    // TODO: better end detecting
                    instance._socket.once('end', endHandler);
                    instance._socket.once('close', endHandler);
                    instance._socket.once('error', errHandler);
                    
                    instance._socket.once('readable', () => {
                        const read = instance._socket.read();

                        if (!read) return;

                        instance._socket.off('end', endHandler);
                        instance._socket.off('close', endHandler);
                        instance._socket.off('error', errHandler);

                        resolve({ done: false, value: read });
                    });
                });
            }
        };
    }

    get ended() {
        return this._ended;
    }

    write(data: ArrayBuffer): void {
        if (this._ended) throw 'Tried to send data from closed socket';

        this._socket.write(new Uint8Array(data));
    }

    close(): void {
        if (this._ended) throw 'Tried to close socket already closed';

        this._ended = true;
        this._socket.end();
    }

    private onError(err: any) {
        this._ended = true;
        this._err = err;
    }

    private onEnd() {
        this._ended = true;
    }

    static connect(option: NetSocketOptions): Promise<Stream> {
        return new Promise<NodeSocket>((resolve, reject) => {
            const onErr = (err: any) => {
                reject(err);
            };

            const socket = net.connect(option, () => {
                socket.off('error', onErr);
                resolve(new NodeSocket(socket));
            });
            socket.setKeepAlive(option.keepAlive);
            
            socket.on('error', onErr);
        });
    }

    static connectTls(option: NetSocketOptions): Promise<Stream> {
        return new Promise<NodeSocket>((resolve, reject) => {
            const onErr = (err: any) => {
                reject(err);
            };

            const socket = tls.connect(option, () => {
                socket.off('error', onErr);
                resolve(new NodeSocket(socket));
            });
            socket.setKeepAlive(option.keepAlive);
            
            socket.on('error', onErr);
        });
    }

}