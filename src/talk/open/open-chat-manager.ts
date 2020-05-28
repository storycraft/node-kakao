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
import { LocoClient } from "../../client";
import { AsyncIdStore } from "../../store/store";
import { StatusCode } from "../../packet/loco-packet-base";
import { OpenChatChannel } from "../channel/chat-channel";
import { PacketKickMemberRes, PacketKickMemberReq } from "../../packet/packet-kick-member";
import { ChatUser } from "../user/chat-user";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "../../packet/packet-delete-link";
import { PacketRewriteReq, PacketRewriteRes } from "../../packet/packet-rewrite";
import { FeedType } from "../feed/feed-type";
import { PacketSetMemTypeReq, PacketSetMemTypeRes } from "../../packet/packet-set-mem-type";
import { PacketJoinLinkReq, PacketJoinLinkRes } from "../../packet/packet-join-link";
import { PacketUpdateOpenchatProfileReq, PacketUpdateOpenchatProfileRes } from "../../packet/packet-update-openchat-profile";
import { OpenchatProfileType, OpenMemberType } from "./open-link-type";

export class OpenChatManager extends AsyncIdStore<OpenLinkStruct> {

    private static readonly LINK_REGEX: RegExp = /(http(s)?:\/\/(open.kakao.com\/o)?\/)/g;

    private clientLinkIdList: string[];

    constructor(private client: LocoClient) {
        super();

        this.clientLinkIdList = [];
    }

    get Client() {
        return this.client;
    }

    get Interface() {
        return this.client.LocoInterface;
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
        let res = await this.Interface.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkId));

        return res.LinkList;
    }
    
    async fetchInfoFromURL(openLinkURL: string): Promise<OpenLinkStruct | null> {
        if (!openLinkURL.match(OpenChatManager.LINK_REGEX)) return null;

        let res = await this.Interface.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        if (!res.OpenLink) return null;

        if (res.StatusCode === StatusCode.SUCCESS) {
            this.setCache(res.OpenLink.linkId, res.OpenLink);

            return res.OpenLink;
        }

        return null;
    }

    protected async fetchValue(key: Long): Promise<OpenLinkStruct> {
        return (await this.fetchInfoFromIdList([key]))[0];
    }

    async requestClientProfile(): Promise<OpenLinkStruct[]> {
        let openChatToken = this.ClientUser.MainOpenToken;

        let res = await this.Client.LocoInterface.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        return res.LinkList;
    }

    async initOpenSession() {
        this.clear();
        
        this.clientLinkIdList = [];

        let list = await this.requestClientProfile();

        for (let profile of list) {
            this.setCache(profile.linkId, profile);
            this.clientLinkIdList.push(profile.linkId.toString());
        }
    }

    async getLinkOwner(linkId: Long): Promise<ChatUser> {
        let info = await this.get(linkId);
        
        return this.client.UserManager.get(info.owner.userId);
    }

    async kickMember(channel: OpenChatChannel, userId: Long): Promise<boolean> {
        let info = await channel.getChannelInfo();

        if (info.hasUserInfo(userId)) {
            let res = await this.Client.LocoInterface.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, userId));

            return res.StatusCode === StatusCode.SUCCESS;
        }

        return false;
    }
    
    async deleteLink(linkId: Long): Promise<boolean> {
        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;

        let res = await this.Client.LocoInterface.requestPacketRes<PacketDeleteLinkRes>(new PacketDeleteLinkReq(linkId));

        this.delete(linkId);

        let strLinkId = linkId.toString();
        this.clientLinkIdList = this.clientLinkIdList.filter(strKey => strKey !== strLinkId);

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<boolean> {
        let res = await this.Client.LocoInterface.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(channel.LinkId, channel.Id, logId, 1, FeedType.OPENLINK_REWRITE_FEED));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async updateOpenMemberTypeList(channel: OpenChatChannel, idTypeSet: Map<Long, OpenMemberType>): Promise<boolean> {
        let linkId = channel.LinkId;

        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;
        
        let res = await this.Client.LocoInterface.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, Array.from(idTypeSet.keys()), Array.from(idTypeSet.values())));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async setOpenMemberType(channel: OpenChatChannel, userId: Long, type: OpenMemberType): Promise<boolean> {
        let linkId = channel.LinkId;

        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;
        
        let res = await this.Client.LocoInterface.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, [userId], [type]));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async joinOpenLink(linkId: Long, profileType: OpenchatProfileType.MAIN, passcode?: string): Promise<OpenChatChannel | null>;
    async joinOpenLink(linkId: Long, profileType: OpenchatProfileType.KAKAO_ANON, passcode: string, nickname: string, profilePath: string): Promise<OpenChatChannel | null>;
    async joinOpenLink(linkId: Long, profileType: OpenchatProfileType.OPEN_PROFILE, passcode: string, profileLinkId: Long): Promise<OpenChatChannel | null>;
    async joinOpenLink(linkId: Long, profileType: OpenchatProfileType, passcode: string = ''): Promise<OpenChatChannel | null> {
        let packet: PacketJoinLinkReq;
        if (profileType === OpenchatProfileType.MAIN) {
            packet = new PacketJoinLinkReq(linkId, 'EW:', passcode, profileType);
        } else if (profileType === OpenchatProfileType.KAKAO_ANON) {
            packet = new PacketJoinLinkReq(linkId, 'EW:', passcode, profileType, arguments[3], arguments[4]);
        } else if (profileType === OpenchatProfileType.OPEN_PROFILE) {
            packet = new PacketJoinLinkReq(linkId, 'EW:', passcode, profileType, '', '', arguments[3]);
        } else {
            return null;
        }

        let res = await this.client.LocoInterface.requestPacketRes<PacketJoinLinkRes>(packet);

        if (res.StatusCode !== StatusCode.SUCCESS || !res.ChatInfo) return null;

        return this.client.ChannelManager.get(res.ChatInfo.channelId) as Promise<OpenChatChannel>; 
    }

    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.MAIN): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.KAKAO_ANON, nickname: string, profilePath: string): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.OPEN_PROFILE, profileLinkId: Long): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType): Promise<boolean> {
        let packet: PacketUpdateOpenchatProfileReq;
        if (profileType === OpenchatProfileType.MAIN) {
            packet = new PacketUpdateOpenchatProfileReq(channel.LinkId, profileType);
        } else if (profileType === OpenchatProfileType.KAKAO_ANON) {
            packet = new PacketUpdateOpenchatProfileReq(channel.LinkId, profileType, arguments[2], arguments[3]);
        } else if (profileType === OpenchatProfileType.OPEN_PROFILE) {
            packet = new PacketUpdateOpenchatProfileReq(channel.LinkId, profileType, '', '', arguments[2]);
        } else {
            return false;
        }

        let res = await this.client.LocoInterface.requestPacketRes<PacketUpdateOpenchatProfileRes>(packet);

        if (!res.UpdatedProfile) return false;

        let info = await channel.getChannelInfo();
        let userInfo = info.getUserInfo(this.client.ClientUser);
        
        if (userInfo) userInfo.updateFromOpenStruct(res.UpdatedProfile);

        return res.StatusCode === StatusCode.SUCCESS; 
    }

}