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
import * as Crypto from "crypto";
import { Chat } from "../chat/chat";
import { StatusCode } from "../../packet/loco-packet-base";
import { MediaAttachment, MediaHasThumbnail } from "../chat/attachment/chat-attachment";
import { PacketGetTrailerRes, PacketGetTrailerReq } from "../../packet/packet-get-trailer";
import { MediaDownloadInterface } from "./media-download-interface";

export class MediaManager {

    constructor(private client: LocoClient) {

    }
    
    get Client() {
        return this.client;
    }

    get ClientUser() {
        return this.client.ClientUser;
    }

    get ChatManager() {
        return this.client.ChatManager;
    }

    get NetworkManager() {
        return this.client.NetworkManager;
    }

    async sendMedia(channel: ChatChannel, type: ChatType, name: string, data: Buffer, width: number = 0, height: number = 0, ext: string = ''): Promise<Chat | null> {
        let shipRes = await this.NetworkManager.requestPacketRes<PacketShipRes>(new PacketShipReq(channel.Id, type, Long.fromNumber(data.byteLength), this.createMediaHash(data), ext));
        let uploadInterface = this.NetworkManager.createUploadInterface({ host: shipRes.VHost, port: shipRes.Port, keepAlive: true });

        let res = await uploadInterface.upload(this.ClientUser.Id, shipRes.Key, channel.Id, type, name, data, width, height);

        if (res.StatusCode === StatusCode.SUCCESS && res.Chatlog) return await this.ChatManager.chatFromChatlog(res.Chatlog);

        return null;
    }

    async requestThumbnail(mediaAttachment: MediaHasThumbnail): Promise<Buffer | null> {
        if (!mediaAttachment.HasThumbnail) return null;

        let downloader = this.createDownloaderFor(mediaAttachment);

        

        return null;
    }

    async requestMedia(mediaAttachment: MediaAttachment): Promise<Buffer | null> {
        let downloader = this.createDownloaderFor(mediaAttachment);


    
        return null;
    }

    protected async createDownloaderFor(mediaAttachment: MediaAttachment): Promise<MediaDownloadInterface> {
        let trailerRes = await this.NetworkManager.requestPacketRes<PacketGetTrailerRes>(new PacketGetTrailerReq(mediaAttachment.KeyPath, mediaAttachment.RequiredMessageType));
        let downloadInterface = await this.NetworkManager.createDownloadInterface({ host: trailerRes.VHost, port: trailerRes.Port, keepAlive: true });

        return downloadInterface;
    }

    protected createMediaHash(data: Buffer): string {
        let hash = Crypto.createHash('sha1');

        hash.update(data);

        return hash.digest().toString('hex').toUpperCase();
    }

}