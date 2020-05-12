/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum StatusCode {

    SUCCESS = 0,
    PARTIAL = -401, // is it correct?
    OPERATION_DENIED = -500

}

interface LocoPacketBase {

    readonly StatusCode: StatusCode;

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