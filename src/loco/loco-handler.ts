import { LocoResponsePacket } from "../packet/loco-packet-base";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface LocoHandler {

    handle(packet: LocoResponsePacket): void;

}