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
import { AsyncIdStore } from "../../store/store";
import { StatusCode } from "../../packet/loco-packet-base";
import { OpenChatChannel } from "../channel/chat-channel";
import { PacketKickMemberRes, PacketKickMemberReq } from "../../packet/packet-kick-member";
import { ChatUser } from "../user/chat-user";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "../../packet/packet-delete-link";
import { PacketRewriteReq, PacketRewriteRes } from "../../packet/packet-rewrite";
import { FeedType } from "../feed/feed-type";
import { OpenMemberType } from "./open-member-type";
import { PacketSetMemTypeReq, PacketSetMemTypeRes } from "../../packet/packet-set-mem-type";
import { PacketJoinLinkReq } from "../../packet/packet-join-link";
import { PacketUpdateOpenchatProfileReq, PacketUpdateOpenchatProfileRes, OpenchatProfileType } from "../../packet/packet-update-openchat-profile";

export class OpenChatManager extends AsyncIdStore<OpenLinkStruct> {

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

    async getLinkOwner(linkId: Long): Promise<ChatUser> {
        let info = await this.get(linkId);
        
        return this.client.UserManager.get(info.Owner.UserId);
    }

    async kickMember(channel: OpenChatChannel, userId: Long): Promise<boolean> {
        let info = await channel.getChannelInfo();

        if (info.hasUserInfo(userId)) {
            let res = await this.Client.NetworkManager.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, userId));

            return res.StatusCode === StatusCode.SUCCESS;
        }

        return false;
    }
    
    async deleteLink(linkId: Long): Promise<boolean> {
        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;

        let res = await this.Client.NetworkManager.requestPacketRes<PacketDeleteLinkRes>(new PacketDeleteLinkReq(linkId));

        this.delete(linkId);

        let strLinkId = linkId.toString();
        this.clientLinkIdList = this.clientLinkIdList.filter(strKey => strKey !== strLinkId);

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<boolean> {
        let res = await this.Client.NetworkManager.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(channel.LinkId, channel.Id, logId, Math.floor(Date.now() / 1000), FeedType.OPENLINK_REWRITE_FEED));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async updateOpenMemberType(channel: OpenChatChannel, idTypeSet: Map<Long, OpenMemberType>): Promise<boolean> {
        let linkId = channel.LinkId;

        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;
        
        let res = await this.Client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, Array.from(idTypeSet.keys()), Array.from(idTypeSet.values())));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async joinOpenLink(linkId: Long, passcode: string = ''): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketJoinInfoRes>(new PacketJoinLinkReq(linkId, 'EW', passcode));

        return res.StatusCode === StatusCode.SUCCESS; 
    }

    async changeToMainProfile(channelLinkId: Long): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateOpenchatProfileRes>(new PacketUpdateOpenchatProfileReq(channelLinkId, OpenchatProfileType.MAIN));

        return res.StatusCode === StatusCode.SUCCESS; 
    }

    async changeToKakaoProfile(channelLinkId: Long, nickname: string, profilePath: string): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateOpenchatProfileRes>(new PacketUpdateOpenchatProfileReq(channelLinkId, OpenchatProfileType.KAKAO_ANON, nickname, profilePath));

        return res.StatusCode === StatusCode.SUCCESS; 
    }

    async changeToLinkProfile(channelLinkId: Long, profileLinkId: Long): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateOpenchatProfileRes>(new PacketUpdateOpenchatProfileReq(channelLinkId, OpenchatProfileType.OPEN_PROFILE, '', '', profileLinkId));

        return res.StatusCode === StatusCode.SUCCESS; 
    }

}