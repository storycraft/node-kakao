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

export interface LocoRequestPacket extends LocoPacketBase {

    writeBody(): Buffer;
    
    onResponse<T extends LocoResponsePacket>(packet: T): void;

    submitResponseTicket<T extends LocoResponsePacket>(): Promise<T>;
}

export interface LocoResponsePacket extends LocoPacketBase {

    readBody(buffer: Buffer): void;
    
}