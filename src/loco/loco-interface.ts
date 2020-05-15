/*
 * Created on Fri May 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoResponsePacket, LocoRequestPacket } from "../packet/loco-packet-base";

export interface LocoInterface {

    readonly Connected: boolean;
    readonly Logon: boolean;

    disconnect(): Promise<void>;

    sendPacket(packet: LocoRequestPacket): Promise<boolean>;
    requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T>;

}

export interface LocoReceiver {

    requestSent(packetId: number, packet: LocoRequestPacket): void;
    responseReceived(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void;
    disconnected(): void;

}