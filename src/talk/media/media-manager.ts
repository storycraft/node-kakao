/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoClient } from "../../client";
import { ChatType } from "../chat/chat-type";
import { PacketShipReq, PacketShipRes } from "../../packet/packet-ship";
import { ChatChannel } from "../channel/chat-channel";
import { Long } from "bson";
import { PacketCompleteRes } from "../../packet/packet-complete";
import * as Crypto from "crypto";

export class MediaManager {

    constructor(private client: LocoClient) {

    }
    
    get Client() {
        return this.client;
    }

    async sendMedia(channel: ChatChannel, type: ChatType, name: string, data: Buffer, width: number = 0, height: number = 0, ext: string = ''): Promise<PacketCompleteRes> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketShipRes>(new PacketShipReq(channel.Id, type, Long.fromNumber(data.byteLength), this.createMediaHash(data), ext));

        let uploadInterface = this.client.NetworkManager.createUploadInterface({ host: res.VHost, port: res.Port, keepAlive: true });

        await uploadInterface.connect();
        return uploadInterface.upload(this.client.ClientUser.Id, res.Key, channel.Id, type, name, data, width, height);
    }

    protected createMediaHash(data: Buffer): string {
        let hash = Crypto.createHash('sha1');

        hash.update(data);

        return hash.digest().toString('hex').toUpperCase();
    }

}