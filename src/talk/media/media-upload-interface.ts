/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSecureCommandInterface, LocoListener } from "../../loco/loco-interface";
import { HostData } from "../../network/host-data";
import { LocoResponsePacket, StatusCode } from "../../packet/loco-packet-base";
import { PacketHeader } from "../../packet/packet-header-struct";
import { PacketCompleteRes } from "../../packet/media/packet-complete";
import { PacketPostReq, PacketPostRes } from "../../packet/media/packet-post";
import { LocoSecureSocket } from "../../network/loco-secure-socket";
import { ChatType } from "../chat/chat-type";
import { Long } from "bson";
import { PromiseTicket } from "../../ticket/promise-ticket";

export class MediaUploadInterface extends LocoSecureCommandInterface {

    private uploading: boolean;

    private ticketObj: PromiseTicket<PacketCompleteRes>;

    constructor(hostData: HostData, listener: LocoListener | null = null) {
        super(hostData, listener);

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

    async upload(clientUserId: Long, key: string, channelId: Long, type: ChatType, name: string, data: Buffer, width: number, height: number): Promise<PacketCompleteRes> {
        if (this.uploading) {
            throw new Error(`Uploading already started`);
        }

        if (!this.Connected) await this.connect();

        let postRes = await this.requestPacketRes<PacketPostRes>(new PacketPostReq(key, Long.fromNumber(data.byteLength), name, width, height, channelId, type, Long.fromNumber(1172892), false, clientUserId));
        this.uploading = true;

        // ok so destroying structure makes the transaction secure?
        let rawSocket = this.Socket as LocoSecureSocket;
        let buf: Buffer;
        if (postRes.Offset.toNumber() > 0) {
            buf = Buffer.alloc(data.byteLength + postRes.Offset.toNumber());
            data.copy(buf, postRes.Offset.toNumber());
        } else {
            buf = data;
        }

        rawSocket.sendBuffer(data);
        
        return this.ticketObj.createTicket();
    }

}