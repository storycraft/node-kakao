import { EventEmitter } from "events";

/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

interface LocoPacketBase {

    readonly StatusCode: number;

    readonly PacketName: string;

    readonly BodyType: number;

}

export interface LocoRequestPacket extends LocoPacketBase, EventEmitter {

    writeBody(): Buffer;

    on<T extends LocoResponsePacket>(event: 'response' | string, listener: (packet: T) => void): this;

    on(event: string, listener: (...args: any[]) => void): this;

    once<T extends LocoResponsePacket>(event: 'response' | string, listener: (packet: T) => void): this;

    once(event: string, listener: (...args: any[]) => void):this;
    
}

export interface LocoResponsePacket extends LocoPacketBase {

    readBody(buffer: Buffer): void;
    
}