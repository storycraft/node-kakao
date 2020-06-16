/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkStruct, OpenKickedMemberStruct } from "../struct/open/open-link-struct";
import { PacketJoinInfoReq, PacketJoinInfoRes } from "../../packet/packet-join-info";
import { Long } from "bson";
import { PacketInfoLinkRes, PacketInfoLinkReq } from "../../packet/packet-info-link";
import { PacketSyncLinkRes, PacketSyncLinkReq } from "../../packet/packet-sync-link";
import { LocoClient } from "../../client";
import { AsyncIdStore } from "../../store/store";
import { StatusCode } from "../../packet/loco-packet-base";
import { OpenChatChannel } from "../channel/chat-channel";
import { PacketKickMemberRes, PacketKickMemberReq } from "../../packet/packet-kick-member";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "../../packet/packet-delete-link";
import { PacketRewriteReq, PacketRewriteRes } from "../../packet/packet-rewrite";
import { FeedType } from "../feed/feed-type";
import { PacketSetMemTypeReq, PacketSetMemTypeRes } from "../../packet/packet-set-mem-type";
import { PacketUpdateLinkProfileReq, PacketUpdateLinkProfileRes } from "../../packet/packet-update-link-profile";
import { OpenProfileType, OpenMemberType, OpenLinkType } from "./open-link-type";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "../../packet/packet-create-open-link";
import { PacketUpdateOpenLinkReq, PacketUpdateOpenLinkRes } from "../../packet/packet-update-link";
import { OpenLinkSettings } from "./open-link-settings";
import { OpenLinkTemplate } from "./open-link-template";
import { OpenLink, OpenLinkProfile } from "./open-link";
import { ManagedOpenLink, ManagedOpenKickedUserInfo } from "../managed/managed-open-link";
import { OpenUserInfo, UserInfo, OpenKickedUserInfo } from "../user/chat-user";
import { PacketKickListSyncReq, PacketKickListSyncRes } from "../../packet/packet-kick-list-sync";

export class OpenLinkManager extends AsyncIdStore<OpenLink> {

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

    protected fromLinkStruct(linkStruct: OpenLinkStruct): OpenLink {
        let link: ManagedOpenLink;
        if (this.has(linkStruct.linkId)) {
            link = this.getValue(linkStruct.linkId)! as ManagedOpenLink;

            link.updateStruct(linkStruct);
        } else {
            link = new ManagedOpenLink(this, linkStruct.linkId, linkStruct.openToken, linkStruct);
            this.setCache(link.LinkId, link);
        }

        return link;
    }

    protected getFromKickedStruct(kickedMemberStruct: OpenKickedMemberStruct): OpenKickedUserInfo {
        return new ManagedOpenKickedUserInfo(this, kickedMemberStruct);
    }

    async fetchInfoFromIdList(linkIdList: Long[]): Promise<OpenLink[]> {
        let res = await this.Interface.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkIdList));

        let linkList = res.LinkList.map(this.fromLinkStruct.bind(this));

        return linkList;
    }
    
    async fetchInfoFromURL(openLinkURL: string): Promise<OpenLink | null> {
        if (!openLinkURL.match(OpenLinkManager.LINK_REGEX)) return null;

        let res = await this.Interface.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        if (!res.OpenLink) return null;

        if (res.StatusCode === StatusCode.SUCCESS) {
            return this.fromLinkStruct(res.OpenLink);
        }

        return null;
    }

    protected async fetchValue(key: Long): Promise<OpenLink> {
        return (await this.fetchInfoFromIdList([ key ]))[0];
    }

    async requestClientProfile(): Promise<OpenLinkProfile[]> {
        let openChatToken = this.ClientUser.MainOpenToken;

        let res = await this.client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        return res.LinkList.map(this.fromLinkStruct.bind(this)) as OpenLinkProfile[];
    }

    async initOpenSession() {
        this.clear();
        
        this.clientLinkIdList = [];

        let list = await this.requestClientProfile();

        for (let profile of list) {
            this.clientLinkIdList.push(profile.LinkId.toString());
        }
    }

    async kickMember(channel: OpenChatChannel, userId: Long): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, userId));

        return res.StatusCode === StatusCode.SUCCESS;
    }
    
    async deleteLink(linkId: Long): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketDeleteLinkRes>(new PacketDeleteLinkReq(linkId));

        this.delete(linkId);

        let strLinkId = linkId.toString();
        this.clientLinkIdList = this.clientLinkIdList.filter(strKey => strKey !== strLinkId);

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(channel.LinkId, channel.Id, logId, 1, FeedType.OPENLINK_REWRITE_FEED));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async updateOpenMemberTypeList(channel: OpenChatChannel, idTypeSet: Map<Long, OpenMemberType>): Promise<boolean> {
        let linkId = channel.LinkId;

        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, Array.from(idTypeSet.keys()), Array.from(idTypeSet.values())));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async setOpenMemberType(channel: OpenChatChannel, userId: Long, type: OpenMemberType): Promise<boolean> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(channel.LinkId, channel.Id, [ userId ], [ type ]));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.MAIN): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.KAKAO_ANON, nickname: string, profilePath: string): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.OPEN_PROFILE, profileLinkId: Long): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType): Promise<boolean> {
        let packet: PacketUpdateLinkProfileReq;
        if (profileType === OpenProfileType.MAIN) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType);
        } else if (profileType === OpenProfileType.KAKAO_ANON) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType, arguments[2], arguments[3]);
        } else if (profileType === OpenProfileType.OPEN_PROFILE) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType, '', '', arguments[2]);
        } else {
            return false;
        }

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateLinkProfileRes>(packet);

        return res.StatusCode === StatusCode.SUCCESS; 
    }

    async createOpenProfile(settings: OpenLinkTemplate): Promise<OpenLinkStruct | null> {
        const packet = new PacketCreateOpenLinkReq(
            settings.linkName,
            settings.linkCoverPath,
            OpenLinkType.PROFILE,
            settings.description,

            settings.limitProfileType,
            settings.canSearchLink,
            
            1,
            true,
            settings.maxChannelLimit);
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateOpenLinkRes>(packet);

        switch ( res.StatusCode ) {

            case -804: 
                throw new Error('The number of possible openings channel exceeds.');

            case -326:
                throw new Error('Usage restrictions./Protection meansures.');

        }

        if (res.StatusCode !== StatusCode.SUCCESS || !res.OpenLink) return null;

        return res.OpenLink;
    }

    async updateOpenLink(linkId: Long, settings: OpenLinkSettings) {
        const packet = new PacketUpdateOpenLinkReq(
            linkId,
            settings.linkName,
            settings.linkCoverPath,
            settings.maxUserLimit,
            settings.maxChannelLimit,
            settings.passcode,
            settings.description,
            settings.canSearchLink,
            true,
            true,
        );

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateOpenLinkRes>(packet);

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async requestKickList(linkId: Long): Promise<OpenKickedUserInfo[]> {
        let packet = new PacketKickListSyncReq(linkId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketKickListSyncRes>(packet);

        return res.KickedMemberList.map(this.getFromKickedStruct.bind(this));
    }

}