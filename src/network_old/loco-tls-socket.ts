import * as tls from "tls";
import { LocoBasicSocket } from "./loco-socket";
import { LocoReceiver } from "../loco/loco-interface";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoTLSSocket extends LocoBasicSocket {

    constructor(receiver: LocoReceiver, host: string, port: number, keepAlive: boolean) {
        super(receiver, host, port, keepAlive);
    }

    protected createSocketConnection(host: string, port: number, callback: () => void) {
        return tls.connect({
            host: host,
            port: port,
            timeout: 0
        }, callback);
    }

    protected onConnect(): void {
        
    }
    
    protected onConnected(): void {
        
    }

    protected onEnd(buffer: Buffer) {

    }

    protected onError(err: Error) {
        super.onError(err);
    }
}