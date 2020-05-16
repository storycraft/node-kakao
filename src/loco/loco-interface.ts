/*
 * Created on Fri May 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoResponsePacket, LocoRequestPacket } from "../packet/loco-packet-base";
import { PacketHeader } from "../packet/packet-header-struct";

export interface LocoInterface {

    readonly Connected: boolean;
    readonly Logon: boolean;

    disconnect(): Promise<void>;

    sendPacket(packet: LocoRequestPacket): Promise<boolean>;
    requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T>;

    packetSent(packetId: number, packet: LocoRequestPacket): void;
    packetReceived(packetId: number, packet: LocoResponsePacket): void;

    disconnected(): void;

}

export interface LocoReceiver {

    responseReceived(header: PacketHeader, data: Buffer): void;
    disconnected(): void;

}