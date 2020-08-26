/*
 * Created on Mon Jun 08 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Socket } from "net";
import { Transform, TransformCallback } from "stream";
import { ClientConfigProvider } from "../../config/client-config-provider";
import { LocoListener, LocoSecureCommandInterface } from "../../loco/loco-interface";
import { ChunkedBufferList } from "../../network/chunk/chunked-buffer-list";
import { HostData } from "../../network/host-data";
import { LocoSecureSocket } from "../../network/loco-secure-socket";
import { LocoSocket } from "../../network/loco-socket";
import { LocoEncryptedTransformer } from "../../network/stream/loco-encrypted-transformer";
import { LocoPacketResolver } from "../../network/stream/loco-packet-resolver";
import { StatusCode } from "../../packet/loco-packet-base";
import { PacketDownReq, PacketDownRes } from "../../packet/media/packet-down";
import { PacketMiniReq, PacketMiniRes } from "../../packet/media/packet-mini";
import { PromiseTicket } from "../../ticket/promise-ticket";

export class MediaDownloadInterface extends LocoSecureCommandInterface {

    private downloading: boolean;
    private size: number;
    private receiver: MediaDataReceiver;

    private ticketObj: PromiseTicket<Buffer>;

    constructor(hostData: HostData, listener: LocoListener | null = null, configProvider: ClientConfigProvider) {
        super(hostData, listener, configProvider);

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
        return new SecureDownloadSocket(this.ConfigProvider.Configuration.locoPEMPublicKey, this, hostData.host, hostData.port, hostData.keepAlive);
    }

    downloadDone(buffer: Buffer) {
        if (this.Connected) this.disconnect();

        this.ticketObj.resolve(buffer);

        this.downloading = false;
    }

    async download(clientUserId: Long, key: string, channelId: Long): Promise<Buffer | null> {
        let config = this.ConfigProvider.Configuration;

        return this.requestDownload(new PacketDownReq(key, 0, channelId, true, clientUserId, config.agent, config.version, config.netType, config.mccmnc));
    }

    async downloadThumbnail(clientUserId: Long, key: string, channelId: Long): Promise<Buffer | null> {
        let config = this.ConfigProvider.Configuration;

        return this.requestDownload(new PacketMiniReq(key, 0, channelId, 0, 0, clientUserId, config.agent, config.version, config.netType, config.mccmnc));
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

    constructor(pubKey: string, receiver: MediaDownloadInterface, host: string, port: number, keepAlive: boolean) {
        super(pubKey, receiver, host, port, keepAlive);

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