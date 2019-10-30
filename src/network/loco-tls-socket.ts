import * as tls from "tls";
import { LocoSocket } from "./loco-socket";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoTLSSocket extends LocoSocket<tls.TLSSocket> {

    constructor(host: string, port: number, keepAlive: boolean) {
        super(host, port, keepAlive);
    }

    protected createSocketConnection(host: string, port: number, callback: () => void) {
        return tls.connect({
            host: host,
            port: port,
            timeout: 0
        }, callback);
    }

    protected onEnd(buffer: Buffer) {

    }

    protected onError(e: any) {

    }
}