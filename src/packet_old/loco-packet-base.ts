/*
 * Created on Thu Oct 17 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum StatusCode {

    SUCCESS = 0,
    INVALID_USER = -1,
    INVALID_METHOD = -202,
    INVALID_PARAMETER = -203,
    INVALID_CHATROOM_OPERATION = -401,
    CHAT_BLOCKED_BY_FRIEND = -402,
    BLOCKED_IP = -444,
    OPERATION_DENIED = -500,
    INVALID_ACCESSTOKEN = -950,
    BLOCKED_ACCOUNT = -997,
    AUTH_REQUIRED = -998,
    UPDATE_REQUIRED = -999,
    SERVER_UNDER_MAINTENANCE = -9797
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