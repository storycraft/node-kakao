/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { ClientConfigProvider } from "../../config/client-config-provider";
import { LocoListener, LocoSecureCommandInterface } from "../../loco/loco-interface";
import { HostData } from "../../network/host-data";
import { LocoSecureSocket } from "../../network/loco-secure-socket";
import { LocoResponsePacket, StatusCode } from "../../packet/loco-packet-base";
import { PacketCompleteRes } from "../../packet/media/packet-complete";
import { PacketPostReq, PacketPostRes } from "../../packet/media/packet-post";
import { PacketHeader } from "../../packet/packet-header-struct";
import { PromiseTicket } from "../../ticket/promise-ticket";
import { ChatType } from "../chat/chat-type";
import { PacketMultiPostReq, PacketMultiPostRes } from "../../packet/media/packet-multi-post";

export class MediaUploadInterface extends LocoSecureCommandInterface {

    private uploading: boolean;

    private ticketObj: PromiseTicket<PacketCompleteRes>;

    constructor(hostData: HostData, listener: LocoListener | null = null, configProvider: ClientConfigProvider) {
        super(hostData, listener, configProvider);

        this.uploading = false;
        this.ticketObj = new PromiseTicket();
    }

    get Uploading() {
        return this.uploading;
    }

    responseReceived(header: PacketHeader, data: Buffer): LocoResponsePacket {
        let res = super.responseReceived(header, data);

        if (res.PacketName === 'COMPLETE') {
            this.uploading = false;

            if (res.StatusCode !== StatusCode.SUCCESS) {
                this.ticketObj.reject(res.StatusCode);
            } else {
                this.ticketObj.resolve(res as PacketCompleteRes);
            }
            
            this.disconnect();
        }

        return res;
    }

    protected async uploadRawBuffer(offset: Long, data: Buffer) {
        this.uploading = true;

        let rawSocket = this.Socket as LocoSecureSocket;

        let buf: Buffer;
        if (offset.toNumber() > 0) {
            buf = Buffer.alloc(data.length + offset.toNumber());
            data.copy(buf, offset.toNumber());
        } else {
            buf = data;
        }

        rawSocket.sendBuffer(buf);

        return this.ticketObj.createTicket();
    }

    async upload(clientUserId: Long, key: string, channelId: Long, type: ChatType, name: string, data: Buffer, width: number, height: number): Promise<PacketCompleteRes> {
        if (this.uploading) {
            throw new Error(`Uploading already started`);
        }

        if (!this.Connected) await this.connect();

        let config = this.ConfigProvider.Configuration;

        let postRes = await this.requestPacketRes<PacketPostRes>(
            new PacketPostReq(key, Long.fromNumber(data.byteLength), name, width, height, channelId, type, Long.fromNumber(1172892), true,
                clientUserId, config.agent, config.version, config.netType, config.mccmnc)
        );

        return this.uploadRawBuffer(postRes.Offset, data);
    }

    async uploadMulti(clientUserId: Long, key: string, type: ChatType, data: Buffer): Promise<PacketCompleteRes> {
        if (this.uploading) {
            throw new Error(`Uploading already started`);
        }

        if (!this.Connected) await this.connect();

        let config = this.ConfigProvider.Configuration;

        let postRes = await this.requestPacketRes<PacketMultiPostRes>(
            new PacketMultiPostReq(key, Long.fromNumber(data.byteLength), type,
                clientUserId, config.agent, config.version, config.netType, config.mccmnc)
        );

        return this.uploadRawBuffer(postRes.Offset, data);
    }

}