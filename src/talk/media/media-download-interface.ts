/*
 * Created on Mon Jun 08 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSecureCommandInterface, LocoListener } from "../../loco/loco-interface";
import { HostData } from "../../network/host-data";
import { Long } from "bson";
import { PacketMiniReq, PacketMiniRes } from "../../packet/media/packet-mini";
import { PacketDownReq, PacketDownRes } from "../../packet/media/packet-down";
import { LocoSocket } from "../../network/loco-socket";
import { LocoSecureSocket } from "../../network/loco-secure-socket";
import { Socket } from "net";
import { LocoEncryptedTransformer } from "../../network/stream/loco-encrypted-transformer";
import { LocoPacketResolver } from "../../network/stream/loco-packet-resolver";
import { ChunkedBufferList } from "../../network/chunk/chunked-buffer-list";
import { Writable, Transform, TransformCallback } from "stream";
import { StatusCode } from "../../packet/loco-packet-base";
import { PromiseTicket } from "../../ticket/promise-ticket";

export class MediaDownloadInterface extends LocoSecureCommandInterface {

    private downloading: boolean;
    private size: number;
    private receiver: MediaDataReceiver;

    private ticketObj: PromiseTicket<Buffer>;

    constructor(hostData: HostData,  listener: LocoListener | null = null) {
        super(hostData, listener);

        this.downloading = false;
        this.size = -1;
        
        this.ticketObj = new PromiseTicket();

        this.receiver = new MediaDataReceiver(this);
    }
    
    get Downloading() {
        return this.downloading;
    }

    get Size() {
        return this.size;
    }

    get DataReceiver() {
        return this.receiver;
    }

    protected createSocket(hostData: HostData): LocoSocket {
        return new SecureDownloadSocket(this, hostData.host, hostData.port, hostData.keepAlive);
    }

    downloadDone(buffer: Buffer) {
        if (this.Connected) this.disconnect();

        this.ticketObj.resolve(buffer);

        this.downloading = false;
    }

    async download(clientUserId: Long, key: string, channelId: Long): Promise<Buffer | null> {
        return this.requestDownload(new PacketDownReq(key, 0, channelId, true, clientUserId));
    }

    async downloadThumbnail(clientUserId: Long, key: string, channelId: Long): Promise<Buffer | null> {
        return this.requestDownload(new PacketMiniReq(key, 0, channelId, 0, 0, clientUserId));
    }

    protected async requestDownload(req: PacketMiniReq | PacketDownReq) {
        if (this.downloading) {
            throw new Error(`Downloading already started`);
        }
        if (!this.Connected) await this.connect();

        let res = await this.requestPacketRes<PacketMiniRes | PacketDownRes>(req);
        if (res.StatusCode !== StatusCode.SUCCESS) return null;
        this.size = res.Size;

        return this.ticketObj.createTicket();
    }

}

export class SecureDownloadSocket extends LocoSecureSocket {

    private downloader: MediaDownloadInterface;

    constructor(receiver: MediaDownloadInterface, host: string, port: number, keepAlive: boolean) {
        super(receiver, host, port, keepAlive);

        this.downloader = receiver;
    }

    pipeTranformation(socket: Socket) {
        socket.pipe(new LocoEncryptedTransformer(this)).pipe(this.downloader.DataReceiver).pipe(new LocoPacketResolver(this));
    }

}

export class MediaDataReceiver extends Transform {

    private chunkList: ChunkedBufferList;

    constructor(private downloader: MediaDownloadInterface) {
        super();
        
        this.chunkList = new ChunkedBufferList();
    }

    get ChunkList() {
        return this.chunkList;
    }

    _destroy(error: Error | null, callback: (error: Error | null) => void) {
        this.chunkList.clear();

        super._destroy(error, callback);
    }

    _transform(chunk: Buffer, encoding?: string, callback?: TransformCallback) {
        if (this.downloader.Downloading) {
            this.chunkList.append(chunk);

            if (this.chunkList.TotalByteLength >= this.downloader.Size) {
                this.downloader.downloadDone(this.chunkList.toBuffer());
            }
        } else {
            this.push(chunk);
        }

        if (callback) callback();
    }

}