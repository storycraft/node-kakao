import { LocoResponsePacket, LocoRequestPacket } from "../packet_old/loco-packet-base";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LocoPacketHandler {

    onRequest(packetId: number, packet: LocoRequestPacket): void;

    onResponse(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void;

    onDisconnected(): void;

}