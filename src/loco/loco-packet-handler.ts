import { LocoResponsePacket, LocoRequestPacket } from "../packet/loco-packet-base";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LocoPacketHandler {

    onRequest(packet: LocoRequestPacket): void;

    onResponse(packet: LocoResponsePacket): void;

}