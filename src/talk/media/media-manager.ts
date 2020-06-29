/*
 * Created on Sun Jun 07 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoClient } from "../../client";
import { PacketShipReq, PacketShipRes } from "../../packet/packet-ship";
import { ChatChannel } from "../channel/chat-channel";
import { Long } from "bson";
import * as Crypto from "crypto";
import { Chat } from "../chat/chat";
import { StatusCode } from "../../packet/loco-packet-base";
import { MediaAttachment, MediaHasThumbnail } from "../chat/attachment/chat-attachment";
import { PacketGetTrailerRes, PacketGetTrailerReq } from "../../packet/packet-get-trailer";
import { MediaDownloadInterface } from "./media-download-interface";
import { MediaTemplates } from "../chat/template/media-template";

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

    async sendMedia(channel: ChatChannel, template: MediaTemplates): Promise<Chat | null> {
        let shipRes = await this.NetworkManager.requestPacketRes<PacketShipRes>(new PacketShipReq(channel.Id, template.type, Long.fromNumber(template.data.byteLength), this.createMediaHash(template.data), template.ext || ''));
        let uploadInterface = this.NetworkManager.createUploadInterface({ host: shipRes.VHost, port: shipRes.Port, keepAlive: true });

        let res = await uploadInterface.upload(this.ClientUser.Id, shipRes.Key, channel.Id, template.type, template.name, template.data, template.width || 0, template.height || 0);

        if (res.StatusCode === StatusCode.SUCCESS && res.Chatlog) return this.ChatManager.chatFromChatlog(res.Chatlog);

        return null;
    }

    async requestThumbnail(channel: ChatChannel, mediaAttachment: MediaHasThumbnail): Promise<Buffer | null> {
        if (!mediaAttachment.HasThumbnail) return null;

        let downloader = await this.createDownloaderFor(mediaAttachment);

        return downloader.downloadThumbnail(this.ClientUser.Id, mediaAttachment.KeyPath, channel.Id);
    }

    async requestMedia(channel: ChatChannel, mediaAttachment: MediaAttachment): Promise<Buffer | null> {
        let downloader = await this.createDownloaderFor(mediaAttachment);
    
        return downloader.download(this.ClientUser.Id, mediaAttachment.KeyPath, channel.Id);
    }

    protected async createDownloaderFor(mediaAttachment: MediaAttachment): Promise<MediaDownloadInterface> {
        let trailerRes = await this.NetworkManager.requestPacketRes<PacketGetTrailerRes>(new PacketGetTrailerReq(mediaAttachment.KeyPath, mediaAttachment.RequiredMessageType));
        let downloadInterface = this.NetworkManager.createDownloadInterface({ host: trailerRes.VHost, port: trailerRes.Port, keepAlive: true });

        return downloadInterface;
    }

    protected createMediaHash(data: Buffer): string {
        let hash = Crypto.createHash('sha1');

        hash.update(data);

        return hash.digest().toString('hex').toUpperCase();
    }

}