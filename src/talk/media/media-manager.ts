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
import { MediaAttachment, MediaHasThumbnail, MultiPhotoAttachment } from "../chat/attachment/chat-attachment";
import { PacketGetTrailerRes, PacketGetTrailerReq } from "../../packet/packet-get-trailer";
import { MediaDownloadInterface } from "./media-download-interface";
import { MediaTemplates, MultiMediaTemplates } from "../chat/template/media-template";
import { PacketCompleteRes } from "../../packet/media/packet-complete";
import { PacketMultiShipReq, PacketMultiShipRes } from "../../packet/packet-multi-ship";
import { AttachmentTemplate } from "../chat/template/message-template";
import { PacketForwardReq } from "../../packet/packet-forward";
import { ChatType } from "../chat/chat-type";
import { JsonUtil } from "../../util/json-util";

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
        let res: PacketCompleteRes;

        if ('mediaList' in template) {
            let multiShipRes = await this.NetworkManager.requestPacketRes<PacketMultiShipRes>(
                new PacketMultiShipReq(
                    channel.Id,
                    template.type,
                    template.mediaList.map(item => Long.fromNumber(item.data.length)),
                    template.mediaList.map(item => this.createMediaHash(item.data)),
                    template.mediaList.map(item => item.ext || ''),
                )
            );
            
            let reqList: Promise<PacketCompleteRes>[] = [];
            let length = template.mediaList.length;

            if (length !== multiShipRes.KeyList.length) throw new Error(`Request size mismatch`);

            for (let i = 0; i < length; i++) {
                let media = template.mediaList[i];

                let key = multiShipRes.KeyList[i];
                let vHost = multiShipRes.VHostList[i];
                let port = multiShipRes.PortList[i];

                let uploadIface = this.NetworkManager.createUploadInterface({ host: vHost, port: port, keepAlive: true });

                reqList.push(uploadIface.uploadMulti(this.ClientUser.Id, key, template.type, media.data));
            }

            let completeList = await Promise.all(reqList);

            let errList = completeList.filter(completeRes => completeRes.StatusCode !== StatusCode.SUCCESS);

            if (errList.length > 0) return null;

            return this.ChatManager.forwardRaw(
                    channel,
                    ChatType.MultiPhoto,
                    '',
                    new MultiPhotoAttachment(
                        multiShipRes.KeyList,
                        template.mediaList.map(item => Long.fromNumber(item.data.length)),
                        template.mediaList.map(item => item.width),
                        template.mediaList.map(item => item.height),
                        multiShipRes.MimeTypeList
                    ).toJsonAttachment());
        } else {
            let shipRes = await this.NetworkManager.requestPacketRes<PacketShipRes>(
                new PacketShipReq(
                    channel.Id,
                    template.type,
                    Long.fromNumber(template.data.byteLength),
                    this.createMediaHash(template.data),
                    template.ext || ''
                )
            );

            let uploadInterface = this.NetworkManager.createUploadInterface({ host: shipRes.VHost, port: shipRes.Port, keepAlive: true });
    
            res = await uploadInterface.upload(this.ClientUser.Id, shipRes.Key, channel.Id, template.type, template.name, template.data, 'width' in template ? template.width : 0, 'height' in template ? template.height : 0);

            if (res.StatusCode === StatusCode.SUCCESS && res.Chatlog) return this.ChatManager.chatFromChatlog(res.Chatlog);
        }

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