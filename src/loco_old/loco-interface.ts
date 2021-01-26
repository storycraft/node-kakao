/*
 * Created on Fri May 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoResponsePacket, LocoRequestPacket } from "../packet_old/loco-packet-base";
import { PacketHeader } from "../packet_old/packet-header-struct";
import { LocoSocket } from "../network_old/loco-socket";
import { LocoPacketList } from "../packet_old/loco-packet-list";
import { HostData } from "../network_old/host-data";
import { LocoSecureSocket } from "../network_old/loco-secure-socket";
import { LocoTLSSocket } from "../network_old/loco-tls-socket";
import { ClientConfigProvider } from "../config/client-config-provider_old";

export interface LocoInterface {

    readonly Connected: boolean;

    connect(): Promise<boolean>;
    disconnect(): boolean;

    sendPacket(packet: LocoRequestPacket): Promise<boolean>;
    requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T>;

    onError(err: Error): void;

}

export interface LocoRequestInterface {

    sendPacket(packet: LocoRequestPacket): Promise<boolean>;
    requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket): Promise<T>;

}

export interface LocoReceiver {

    responseReceived(header: PacketHeader, data: Buffer): LocoResponsePacket;

    onError(err: Error): void;

    disconnected(): void;

}

export interface LocoListener {

    packetSent(packetId: number, packet: LocoRequestPacket): void;
    packetReceived(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void;

    onError(err: Error): void;

    disconnected(): void;

}

export abstract class LocoCommandInterface implements LocoInterface, LocoReceiver {

    private packetCount: number;
    private socket: LocoSocket;

    private packetMap: Map<number, LocoRequestPacket>;

    constructor(hostData: HostData, private listener: LocoListener | null = null, private configProvider: ClientConfigProvider) {
        this.packetCount = 0;
        this.packetMap = new Map();

        this.socket = this.createSocket(hostData);
    }

    get ConfigProvider() {
        return this.configProvider;
    }

    protected abstract createSocket(hostData: HostData): LocoSocket;

    protected get Socket() {
        return this.socket;
    }

    get Connected() {
        return this.socket.Connected;
    }

    async connect(): Promise<boolean> {
        if (this.Connected) return false;

        return this.socket.connect();
    }

    disconnect(): boolean {
        return this.socket.disconnect();
    }

    get CurrentPacketId() {
        return this.packetCount;
    }

    set CurrentPacketId(value) {
        this.packetCount = value;
    }

    getNextPacketId() {
        return ++this.packetCount;
    }

    async sendPacket(packet: LocoRequestPacket): Promise<boolean> {
        if (!this.Connected) {
            return false;
        }

        let packetId = this.getNextPacketId();

        this.packetMap.set(packetId, packet);

        if (!LocoPacketList.hasReqPacket(packet.PacketName)) {
            throw new Error(`Tried to send invalid packet ${packet.PacketName}`);
        }

        let header: PacketHeader = {
            packetId: packetId,
            statusCode: 0,
            packetName: packet.PacketName,
            bodyType: 0,
            bodySize: 0
        };

        let bodyBuffer = packet.writeBody();

        header.bodySize = bodyBuffer.byteLength;

        let res = await this.socket.sendPacket(header, bodyBuffer);

        if (this.listener) this.listener.packetSent(packetId, packet);

        return res;
    }

    async requestPacketRes<T extends LocoResponsePacket>(packet: LocoRequestPacket) {
        let ticket = packet.submitResponseTicket<T>();

        if (!(await this.sendPacket(packet))) {
            throw new Error(`Request for ${packet.PacketName} failed`);
        }

        return ticket;
    }

    responseReceived(header: PacketHeader, data: Buffer): LocoResponsePacket {
        try {
            let packetId = header.packetId;
            let packet = this.structToPacket(header, data);
            let reqPacket = this.packetMap.get(packetId);

            if (reqPacket) {
                this.packetMap.delete(packetId);
                reqPacket.onResponse(packet);
            }

            if (this.listener) this.listener.packetReceived(packetId, packet, reqPacket);

            return packet;
        } catch(e) {
            throw new Error(`Error while processing packet#${header.packetId} ${header.packetName}: ${e}`);
        }
    }

    protected structToPacket<T extends LocoResponsePacket>(header: PacketHeader, bodyBuffer: Buffer, offset: number = 0): T {
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

    onError(err: Error) {
        this.listener?.onError(err);
    }

    disconnected() {
        this.packetMap.clear();
        this.listener?.disconnected();
    }

}

export class LocoTLSCommandInterface extends LocoCommandInterface {

    protected createSocket(hostData: HostData): LocoSocket {
        return new LocoTLSSocket(this, hostData.host, hostData.port, hostData.keepAlive);
    }

}

export class LocoSecureCommandInterface extends LocoCommandInterface {

    protected createSocket(hostData: HostData): LocoSocket {
        return new LocoSecureSocket(this.ConfigProvider.Configuration.locoPEMPublicKey, this, hostData.host, hostData.port, hostData.keepAlive);
    }

}