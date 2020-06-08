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

export class MediaUploadInterface extends LocoSecureCommandInterface {

    private uploading: boolean;

    private completeRes: ((resolve: PacketCompleteRes) => void) | null;
    private completeErr: ((reason: any) => void) | null;

    constructor(hostData: HostData, listener: LocoListener | null = null) {
        super(hostData, listener);

        this.uploading = false;
        this.completeRes = null;
        this.completeErr = null;
    }

    get Uploading() {
        return this.uploading;
    }

    responseReceived(header: PacketHeader, data: Buffer): LocoResponsePacket {
        let res = super.responseReceived(header, data);

        if (res.PacketName === 'COMPLETE' && this.completeRes) {
            this.uploading = false;

            if (res.StatusCode !== StatusCode.SUCCESS) {
                if (this.completeErr) this.completeErr(res.StatusCode);
            } else {
                this.completeRes(res as PacketCompleteRes);
            }
            
            this.disconnect();
        }

        return res;
    }

    protected setupCompleteRes(resolve: (value: PacketCompleteRes) => void, reject: (reason: any) => void) {
        this.completeRes = resolve;
        this.completeErr = reject;
    }

    async upload(clientUserId: Long, key: string, channelId: Long, type: ChatType, name: string, data: Buffer, width: number, height: number): Promise<PacketCompleteRes> {
        if (this.uploading) {
            throw new Error(`Uploading already started`);
        }

        if (!this.Connected) await this.connect();

        let postRes = await this.requestPacketRes<PacketPostRes>(new PacketPostReq(key, Long.fromNumber(data.byteLength), name, width, height, channelId, type, Long.fromNumber(1172892), false, clientUserId));

        // ok so destroying structure makes the transaction secure?
        let rawSocket = this.Socket as LocoSecureSocket;
        let buf = Buffer.alloc(data.byteLength + postRes.Offset.toNumber());
        data.copy(buf, postRes.Offset.toNumber());

        rawSocket.sendBuffer(data);
        
        return new Promise(this.setupCompleteRes.bind(this));
    }

}