/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkStruct, OpenKickedMemberStruct, OpenLinkReactionInfo, LinkReactionType } from "../struct/open/open-link-struct";
import { PacketJoinInfoReq, PacketJoinInfoRes } from "../../packet/packet-join-info";
import { Long } from "bson";
import { PacketInfoLinkRes, PacketInfoLinkReq } from "../../packet/packet-info-link";
import { PacketSyncLinkRes, PacketSyncLinkReq } from "../../packet/packet-sync-link";
import { LocoClient } from "../../client";
import { AsyncIdInstanceStore } from "../../store/store";
import { StatusCode } from "../../packet/loco-packet-base";
import { OpenChatChannel } from "../channel/chat-channel";
import { PacketKickMemberRes, PacketKickMemberReq } from "../../packet/packet-kick-member";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "../../packet/packet-delete-link";
import { PacketRewriteReq, PacketRewriteRes } from "../../packet/packet-rewrite";
import { FeedType } from "../feed/feed-type";
import { PacketSetMemTypeReq, PacketSetMemTypeRes } from "../../packet/packet-set-mem-type";
import { PacketUpdateLinkProfileReq, PacketUpdateLinkProfileRes } from "../../packet/packet-update-link-profile";
import { OpenMemberType, OpenLinkType } from "./open-link-type";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "../../packet/packet-create-open-link";
import { PacketUpdateOpenLinkReq, PacketUpdateOpenLinkRes } from "../../packet/packet-update-link";
import { OpenLinkSettings } from "./open-link-settings";
import { OpenLinkTemplate } from "./open-link-template";
import { OpenLink, OpenLinkProfile } from "./open-link";
import { ManagedOpenLink, ManagedOpenKickedUserInfo } from "../managed/managed-open-link";
import { OpenKickedUserInfo } from "../user/chat-user";
import { PacketKickListSyncReq, PacketKickListSyncRes } from "../../packet/packet-kick-list-sync";
import { RequestResult } from "../request/request-result";
import { PacketKickListDelItemReq, PacketKickListDelItemRes } from "../../packet/packet-kick-list-del-item";
import { PacketReactionCountReq, PacketReactionCountRes } from "../../packet/packet-reaction-count";
import { PacketReactReq, PacketReactRes } from "../../packet/packet-react";
import { OpenProfileTemplates } from "./open-link-profile-template";

export class OpenLinkManager extends AsyncIdInstanceStore<OpenLink | null> {

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

    async getFromURL(openLinkURL: string): Promise<OpenLink | null> {
        let res = await this.Interface.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        if (res.OpenLink) return this.getWithLinkStruct(res.OpenLink.linkId, res.OpenLink);

        return null;
    }

    protected async requestLinkFromIdList(linkIdList: Long[]): Promise<OpenLinkStruct[]> {
        let res = await this.Interface.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkIdList));

        return res.LinkList;
    }

    protected async requestLinkFromId(linkId: Long): Promise<OpenLinkStruct | null> {
        let res = await this.Interface.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq([ linkId ]));

        return res.LinkList[0] || null;
    }
    
    protected async requestLinkFromURL(openLinkURL: string): Promise<OpenLinkStruct | null> {
        let res = await this.Interface.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        return res.OpenLink || null;
    }
    
    protected getWithLinkStruct(linkId: Long, linkStruct: OpenLinkStruct): OpenLink {
        if (this.has(linkId)) {
            let link = this.getFromMap(linkId)! as ManagedOpenLink;

            link.updateStruct(linkStruct);
            
            return link;
        }

        let link = this.createWithLinkStruct(linkId, linkStruct);
        this.set(linkId, link);

        return link;
    }

    async updateInfo(link: OpenLink): Promise<OpenLink> {
        let linkStruct = await this.requestLinkFromId(link.LinkId);

        if (linkStruct) (link as ManagedOpenLink).updateStruct(linkStruct);
        
        return link;
    }

    protected createWithLinkStruct(linkId: Long, linkStruct: OpenLinkStruct): OpenLink {
        return new ManagedOpenLink(this, linkId, linkStruct.openToken, linkStruct);
    }

    protected getFromKickedStruct(kickedMemberStruct: OpenKickedMemberStruct): OpenKickedUserInfo {
        return new ManagedOpenKickedUserInfo(this, kickedMemberStruct);
    }

    protected async createInstanceFor(key: Long): Promise<OpenLink | null> {
        let linkStruct = await this.requestLinkFromId(key);

        if (!linkStruct) return null;

        return this.createWithLinkStruct(key, linkStruct);
    }

    async requestClientProfile(): Promise<RequestResult<OpenLinkProfile[]>> {
        let openChatToken = this.ClientUser.MainOpenToken;

        let res = await this.client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        return { status: res.StatusCode, result: res.LinkList.map((linkStruct) => this.getWithLinkStruct(linkStruct.linkId, linkStruct)) as OpenLinkProfile[] };
    }

    async initOpenSession() {
        this.clear();
        
        this.clientLinkIdList = [];

        let list = await this.requestClientProfile();

        if (list.status !== StatusCode.SUCCESS || !list.result) return;

        for (let profile of list.result) {
            this.clientLinkIdList.push(profile.LinkId.toString());
        }
    }

    async kickMember(channel: OpenChatChannel, userId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, userId));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }
    
    async deleteLink(linkId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketDeleteLinkRes>(new PacketDeleteLinkReq(linkId));

        this.delete(linkId);

        let strLinkId = linkId.toString();
        this.clientLinkIdList = this.clientLinkIdList.filter(strKey => strKey !== strLinkId);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }
    
    async handOverHost(channel: OpenChatChannel, newHostUserId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(channel.LinkId, channel.Id, [ newHostUserId, channel.Client.ClientUser.Id ], [ OpenMemberType.OWNER, OpenMemberType.NONE ]));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(channel.LinkId, channel.Id, logId, 1, FeedType.OPENLINK_REWRITE_FEED));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async setOpenMemberType(channel: OpenChatChannel, userId: Long, type: OpenMemberType.NONE | OpenMemberType.MANAGER): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(channel.LinkId, channel.Id, [ userId ], [ type ]));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async changeProfile(channel: OpenChatChannel, profile: OpenProfileTemplates): Promise<RequestResult<boolean>> {
        let packet = new PacketUpdateLinkProfileReq(channel.LinkId, profile.type, profile.anonNickname, profile.anonProfilePath, profile.profileLinkId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateLinkProfileRes>(packet);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async createOpenProfile(template: OpenLinkTemplate): Promise<RequestResult<OpenLinkProfile>> {
        const packet = new PacketCreateOpenLinkReq(
            template.linkName,
            template.linkCoverPath,
            OpenLinkType.PROFILE,

            template.description,
            template.profileContent || null,

            template.allowAnonProfile,
            template.canSearchLink,
            
            Long.fromNumber(Date.now() / 1000),
            true,
            template.maxChannelLimit,
            template.clientProfile.type,
            template.clientProfile.anonNickname,
            template.clientProfile.anonProfilePath,
            template.clientProfile.profileLinkId,
            template.maxUserLimit);
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateOpenLinkRes>(packet);

        return { status: res.StatusCode, result: res.OpenLink && this.getWithLinkStruct(res.OpenLink.linkId, res.OpenLink) as OpenLinkProfile || null };
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

    async deleteFromKickList(linkId: Long, kickedInfo: OpenKickedUserInfo): Promise<RequestResult<boolean>> {
        return this.deleteFromKickListId(linkId, kickedInfo.KickedChannelId, kickedInfo.Id);
    }

    async deleteFromKickListId(linkId: Long, channelId: Long, userId: Long): Promise<RequestResult<boolean>> {
        let packet = new PacketKickListDelItemReq(linkId, channelId, userId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketKickListDelItemRes>(packet);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async requestKickList(linkId: Long): Promise<RequestResult<OpenKickedUserInfo[]>> {
        let packet = new PacketKickListSyncReq(linkId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketKickListSyncRes>(packet);

        return { status: res.StatusCode, result: res.KickedMemberList.map(this.getFromKickedStruct.bind(this)) };
    }

    async requestReactionInfo(linkId: Long): Promise<RequestResult<OpenLinkReactionInfo>> {
        let packet = new PacketReactionCountReq(linkId);

        let res = await this.client.NetworkManager.requestPacketRes<PacketReactionCountRes>(packet);

        return { status: res.StatusCode, result: { reactionCount: res.ReactionCount.toNumber(), reactionType: res.ReactType } };
    }

    async setLinkReacted(linkId: Long, reactionType: LinkReactionType): Promise<RequestResult<boolean>> {
        let packet = new PacketReactReq(linkId, reactionType);

        let res = await this.client.NetworkManager.requestPacketRes<PacketReactRes>(packet);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

}