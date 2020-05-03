/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkStruct } from "../struct/open-link-struct";
import { PacketJoinInfoReq, PacketJoinInfoRes } from "../../packet/packet-join-info";
import { Long } from "bson";
import { PacketInfoLinkRes, PacketInfoLinkReq } from "../../packet/packet-info-link";
import { PacketSyncLinkRes, PacketSyncLinkReq } from "../../packet/packet-sync-link";
import { TalkClient } from "../../talk-client";
import { IdStore } from "../../store/store";
import { StatusCode } from "../../packet/loco-packet-base";
import { OpenChatChannel } from "../channel/chat-channel";
import { PacketKickMemberRes, PacketKickMemberReq } from "../../packet/packet-kick-member";
import { ChatUser } from "../user/chat-user";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "../../packet/packet-delete-link";
import { PacketRewriteReq, PacketRewriteRes } from "../../packet/packet-rewrite";
import { FeedType } from "../feed/feed-type";

export class OpenChatManager extends IdStore<OpenLinkStruct> {

    private static readonly LINK_REGEX: RegExp = /(http(s)?:\/\/(open.kakao.com\/o)?\/)/g;

    private clientLinkIdList: string[];

    constructor(private client: TalkClient) {
        super();

        this.clientLinkIdList = [];
    }

    get Client() {
        return this.client;
    }

    get NetworkManager() {
        return this.client.NetworkManager;
    }

    get ClientUser() {
        return this.client.ClientUser;
    }

    get ClientLinkList(): Long[] {
        return this.clientLinkIdList.map(strId => Long.fromString(strId));
    }

    isClientLink(id: Long) {
        return this.clientLinkIdList.includes(id.toString());
    }

    async fetchInfoFromIdList(linkId: Long[]): Promise<OpenLinkStruct[]> {
        let res = await this.NetworkManager.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkId));

        return res.LinkList;
    }
    
    async fetchInfoFromURL(openLinkURL: string): Promise<OpenLinkStruct | null> {
        if (!openLinkURL.match(OpenChatManager.LINK_REGEX)) return null;

        return this.fetchInfoFromCode(openLinkURL.replace(OpenChatManager.LINK_REGEX, ''), 'EW');
    }

    async fetchInfoFromCode(openLinkCode: string, ref: string = 'EW'): Promise<OpenLinkStruct | null> {
        let res = await this.NetworkManager.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkCode, ref));

        if (res.StatusCode === StatusCode.SUCCESS) {
            this.setCache(res.OpenLink.LinkId, res.OpenLink);

            return res.OpenLink;
        }

        return null;
    }

    protected async fetchValue(key: Long): Promise<OpenLinkStruct> {
        return (await this.fetchInfoFromIdList([key]))[0];
    }

    async requestClientProfile(): Promise<OpenLinkStruct[]> {
        let openChatToken = this.ClientUser.MainOpenToken;

        let res = await this.Client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        return res.LinkList;
    }

    async initOpenSession() {
        this.clear();
        this.clientLinkIdList = [];

        let list = await this.requestClientProfile();

        for (let profile of list) {
            this.setCache(profile.LinkId, profile);
            this.clientLinkIdList.push(profile.LinkId.toString());
        }
    }

    async kickMember(channel: OpenChatChannel, user: ChatUser): Promise<boolean> {
        let info = await channel.getChannelInfo();

        if (info.hasUserInfo(user.Id)) {
            let res = await this.Client.NetworkManager.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, user.Id));

            return res.StatusCode === StatusCode.SUCCESS;
        }

        return false;
    }
    
    async deleteLink(linkId: Long): Promise<boolean> {
        let info = await this.get(linkId);

        if (this.ClientUser.Id.notEquals(info.Owner.UserId)) return false;

        let res = await this.Client.NetworkManager.requestPacketRes<PacketDeleteLinkRes>(new PacketDeleteLinkReq(linkId));

        this.delete(linkId);

        let strLinkId = linkId.toString();
        this.clientLinkIdList = this.clientLinkIdList.filter(strKey => strKey !== strLinkId);

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<boolean> {
        let linkId = channel.LinkId;

        let res = await this.Client.NetworkManager.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(linkId, channel.Id, logId, Date.now() / 1000, FeedType.OPENLINK_REWRITE_FEED));

        return res.StatusCode === StatusCode.SUCCESS;
    }

}