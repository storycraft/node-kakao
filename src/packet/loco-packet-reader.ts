import { PacketHeader } from "./packet-header-struct";
import { LocoResponsePacket } from "./loco-packet-base";
import { LocoPacketList } from "./loco-packet-list";
import * as Bson from "bson";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketReader {

    private latestReadPacketId: number;

    constructor() {
        this.latestReadPacketId = -1;
    }

    get LatestReadPacketId() {
        return this.latestReadPacketId;
    }

    structToPacket<T extends LocoResponsePacket>(header: PacketHeader, bodyBuffer: Buffer, offset: number = 0): T {
        let bodyBuf = bodyBuffer.slice(offset, offset + header.bodySize);

        let packet: LocoResponsePacket;

        if (LocoPacketList.hasResPacket(header.packetName)) {
            packet = LocoPacketList.getResPacketByName(header.packetName, header.statusCode);
        } else {
            if (LocoPacketList.hasResBodyType(header.bodyType)) {
                packet = LocoPacketList.getDefaultResPacket(header.bodyType, header.packetName, header.statusCode);
            } else {
                throw new Error(`Invalid packet type: ${header.bodyType}`);
            }
        }

        packet.readBody(bodyBuf);

        return packet as T;
    }

}