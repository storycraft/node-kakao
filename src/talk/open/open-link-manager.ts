/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkStruct, OpenKickedMemberStruct, OpenLinkReactionInfo } from "../struct/open/open-link-struct";
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
import { OpenKickedUserInfo } from "../user/chat-user";
import { PacketKickListSyncReq, PacketKickListSyncRes } from "../../packet/packet-kick-list-sync";
import { RequestResult } from "../request/request-result";
import { PacketKickListDelItemReq, PacketKickListDelItemRes } from "../../packet/packet-kick-list-del-item";
import { PacketReactionCountReq, PacketReactionCountRes } from "../../packet/packet-reaction-count";
import { PacketReactReq, PacketReactRes } from "../../packet/packet-react";

export class OpenLinkManager extends AsyncIdStore<OpenLink> {

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

    async requestLinkFromId(linkId: Long): Promise<RequestResult<OpenLink>> {
        let result = await this.requestLinkFromIdList([ linkId ]) as any;

        let link;
        if (result.result) link = result.result[0];

        // hax
        result.result = link;

        return result as RequestResult<OpenLink>;
    }

    async requestLinkFromIdList(linkIdList: Long[]): Promise<RequestResult<OpenLink[]>> {
        let res = await this.Interface.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkIdList));

        let linkList = res.LinkList.map(this.fromLinkStruct.bind(this));

        return { status: res.StatusCode, result: linkList };
    }
    
    async requestLinkFromURL(openLinkURL: string): Promise<RequestResult<OpenLink>> {
        let res = await this.Interface.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        let link;
        if (res.OpenLink) link = this.fromLinkStruct(res.OpenLink);

        return { status: res.StatusCode, result: link };
    }

    protected async fetchValue(key: Long): Promise<OpenLink> {
        return (await this.requestLinkFromId(key)).result!;
    }

    async requestClientProfile(): Promise<RequestResult<OpenLinkProfile[]>> {
        let openChatToken = this.ClientUser.MainOpenToken;

        let res = await this.client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

        return { status: res.StatusCode, result: res.LinkList.map(this.fromLinkStruct.bind(this)) as OpenLinkProfile[] };
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

    async hideChat(channel: OpenChatChannel, logId: Long): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketRewriteRes>(new PacketRewriteReq(channel.LinkId, channel.Id, logId, 1, FeedType.OPENLINK_REWRITE_FEED));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async updateOpenMemberTypeList(channel: OpenChatChannel, idTypeSet: Map<Long, OpenMemberType>): Promise<RequestResult<boolean>> {
        let linkId = channel.LinkId;

        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, Array.from(idTypeSet.keys()), Array.from(idTypeSet.values())));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async setOpenMemberType(channel: OpenChatChannel, userId: Long, type: OpenMemberType): Promise<RequestResult<boolean>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(channel.LinkId, channel.Id, [ userId ], [ type ]));

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.MAIN): Promise<RequestResult<boolean>>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.KAKAO_ANON, nickname: string, profilePath: string): Promise<RequestResult<boolean>>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType.OPEN_PROFILE, profileLinkId: Long): Promise<RequestResult<boolean>>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenProfileType): Promise<RequestResult<boolean>> {
        let packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType);
        if (profileType === OpenProfileType.KAKAO_ANON) {
            packet.Nickname = arguments[2];
            packet.ProfilePath = arguments[3];
        } else if (profileType === OpenProfileType.OPEN_PROFILE) {
            packet.ProfileLinkId = arguments[2];
        }

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateLinkProfileRes>(packet);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

    async createOpenProfile(settings: OpenLinkTemplate): Promise<RequestResult<OpenLinkStruct>> {
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

        return { status: res.StatusCode, result: res.OpenLink };
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

        return { status: res.StatusCode, result: { reactionCount: res.ReactionCount.toNumber(), reacted: !!res.Reacted } };
    }

    async setLinkReacted(linkId: Long, reacted: boolean): Promise<RequestResult<boolean>> {
        let packet = new PacketReactReq(linkId, reacted ? 1 : 0);

        let res = await this.client.NetworkManager.requestPacketRes<PacketReactRes>(packet);

        return { status: res.StatusCode, result: res.StatusCode === StatusCode.SUCCESS };
    }

}