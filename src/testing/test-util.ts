/*
 * Created on Mon May 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoPacketHandler } from "../loco/loco-packet-handler";
import { LocoRequestPacket, LocoResponsePacket } from "../packet/loco-packet-base";
import { TalkClient } from "../client";
import { LocoKickoutType, PacketKickoutRes } from "../packet/packet-kickout";
import * as Util from 'util';
import * as Crypto from 'crypto';
import { NetworkManager } from "../network/network-manager";

export namespace TestUtil {

    export class VerboseHandler implements LocoPacketHandler {

        private reason: LocoKickoutType;

        constructor() {
            this.reason = LocoKickoutType.UNKNOWN;
        }
    
        onDisconnected(): void {
            console.log(`!! Disconnected !! code: ${this.reason}(${LocoKickoutType[this.reason]})`);
        }
    
        onRequest(packetId: number, packet: LocoRequestPacket): void {
            console.log(`${packetId} | ${packet.PacketName} <- ${Util.inspect(packet, false, 4, true)}`);
        }
        
        onResponse(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void {
            if (packet instanceof PacketKickoutRes) {
                this.reason = (packet as PacketKickoutRes).Reason;
            }

            console.log(`${packetId} | ${packet.PacketName} -> ${Util.inspect(packet, false, 4, true)}`);
        }
    
    }

    export class FilteredHandler extends VerboseHandler {

        constructor(
            private filter: RegExp
        ) {
            super();
        }
        
        onRequest(packetId: number, packet: LocoRequestPacket) {
            if (packet.PacketName.match(this.filter) || packet.PacketName === 'KICKOUT') {
                super.onRequest(packetId, packet);
            }
        }

        onResponse(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket) {
            if (packet.PacketName.match(this.filter)) {
                super.onResponse(packetId, packet, reqPacket);
            }
        }

    }

    export class WrappedHandler implements LocoPacketHandler {

        constructor(
            private oldHandler: LocoPacketHandler,
            private hook: LocoPacketHandler
            ) {
    
        }

        onDisconnected(): void {
            this.hook.onDisconnected();

            this.oldHandler.onDisconnected();
        }
    
        onRequest(packetId: number, packet: LocoRequestPacket): void {
            this.hook.onRequest(packetId, packet);
    
            this.oldHandler.onRequest(packetId, packet);
        }
        
        onResponse(packetId: number, packet: LocoResponsePacket, reqPacket?: LocoRequestPacket): void {
            this.hook.onResponse(packetId, packet, reqPacket);
            
            this.oldHandler.onResponse(packetId, packet, reqPacket);
        }

    }

    export class HookedClient extends TalkClient {

        constructor(name: string, deviceUUID: string, hook: LocoPacketHandler) {
            super(name, deviceUUID);

            let networkManager = this.NetworkManager as NetworkManager;

            networkManager.Handler = new WrappedHandler(networkManager.Handler, hook);
        }

    }

    export function randomDeviceUUID() {
        return Crypto.randomBytes(64).toString('base64');
    }

}