/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkStruct } from "../struct/open/open-link-struct";
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
import { PacketUpdateLinkProfileReq, PacketUpdateLinkProfileRes } from "../../packet/packet-update-link-profile";
import { OpenchatProfileType, OpenMemberType, OpenChannelType } from "./open-link-type";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "../../packet/packet-create-open-link";
import { PacketUpdateOpenChannelReq, PacketUpdateOpenChannelRes } from "../../packet/packet-update-link-info";
import { KakaoAnonProfile } from "./open-chat-profile";
import { ChannelType } from "../channel/channel-type";
import { OpenLinkSettings } from "./open-link-settings";

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

        let res = await this.client.NetworkManager.requestPacketRes<PacketSyncLinkRes>(new PacketSyncLinkReq(openChatToken));

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
            let res = await this.client.NetworkManager.requestPacketRes<PacketKickMemberRes>(new PacketKickMemberReq(channel.LinkId, channel.Id, userId));

            return res.StatusCode === StatusCode.SUCCESS;
        }

        return false;
    }
    
    async deleteLink(linkId: Long): Promise<boolean> {
        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;

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

        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, Array.from(idTypeSet.keys()), Array.from(idTypeSet.values())));

        return res.StatusCode === StatusCode.SUCCESS;
    }

    async setOpenMemberType(channel: OpenChatChannel, userId: Long, type: OpenMemberType): Promise<boolean> {
        let linkId = channel.LinkId;

        if ((await this.getLinkOwner(linkId)) !== this.ClientUser) return false;
        
        let res = await this.client.NetworkManager.requestPacketRes<PacketSetMemTypeRes>(new PacketSetMemTypeReq(linkId, channel.Id, [userId], [type]));

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

        let res = await this.client.NetworkManager.requestPacketRes<PacketJoinLinkRes>(packet);

        if (res.StatusCode !== StatusCode.SUCCESS || !res.ChatInfo) return null;

        return this.client.ChannelManager.get(res.ChatInfo.channelId) as Promise<OpenChatChannel>; 
    }

    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.MAIN): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.KAKAO_ANON, nickname: string, profilePath: string): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType.OPEN_PROFILE, profileLinkId: Long): Promise<boolean>;
    async changeProfile(channel: OpenChatChannel, profileType: OpenchatProfileType): Promise<boolean> {
        let packet: PacketUpdateLinkProfileReq;
        if (profileType === OpenchatProfileType.MAIN) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType);
        } else if (profileType === OpenchatProfileType.KAKAO_ANON) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType, arguments[2], arguments[3]);
        } else if (profileType === OpenchatProfileType.OPEN_PROFILE) {
            packet = new PacketUpdateLinkProfileReq(channel.LinkId, profileType, '', '', arguments[2]);
        } else {
            return false;
        }

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateLinkProfileRes>(packet);

        if (!res.UpdatedProfile) return false;

        let info = await channel.getChannelInfo();
        let userInfo = info.getUserInfo(this.client.ClientUser);
        
        if (userInfo) userInfo.updateFromOpenStruct(res.UpdatedProfile);

        return res.StatusCode === StatusCode.SUCCESS; 
    }

    /* async createOpenLink(settings: OpenLinkSettings): Promise<OpenLinkStruct | null> {
        const packet = new PacketCreateOpenLinkReq(
            settings.linkName,
            settings.coverURL,
            settings.linkType,
            settings.profileType,
            settings.description,
            settings.profileId,
            settings
            settings.profileId,
            settings.limitProfileType,
            settings.canSearchLink,
            settings.UNKNOWN1,
            settings.UNKNOWN2);

        const res = await this.client.NetworkManager.requestPacketRes<PacketCreateOpenLinkRes>(packet);

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
        const packet = new PacketUpdateOpenChannelReq(
            linkId,
            settings.linkName,
            settings.maxUser,
            settings.passcode,
            settings.description,
            settings.canSearchLink,
            settings.UNKNOWN1,
            settings.UNKNOWN2,
        );

        let res = await this.client.NetworkManager.requestPacketRes<PacketUpdateOpenChannelRes>(packet);

        return res.StatusCode === StatusCode.SUCCESS;
    } */

}

/* export class OpenChatChannelTemplate {
    constructor(
        public title: string,
        public linkImagePath: string,
        public linkType: OpenChannelType,
        public profileType: OpenchatProfileType,
        public description: string,
        public openProfile: KakaoAnonProfile,
        public profileId: number,
        public limitProfileType: boolean = true,
        public canSearchLink: boolean = true,
        public UNKNOWN1: number = Math.floor(Date.now() / 1000),
        public UNKNOWN2: boolean = true
    ) {

    }

    readRawContent(rawData: any) {
        if ( rawData['ln'] ) {
            this.title = rawData['ln'];
        }

        if ( rawData['lip'] ) {
            this.linkImagePath = rawData['lip'];
        }

        if ( rawData['lt'] ) {
            this.linkType = rawData['lt'];
        }

        if ( rawData['ptp'] ) {
            this.profileType = rawData['ptp'];
        }

        switch ( this.profileType ) {
            case OpenchatProfileType.KAKAO_ANON:
                this.openProfile = new KakaoAnonProfile(rawData['nn'], rawData['pp']);
                break;
            case OpenchatProfileType.OPEN_PROFILE:
                this.profileId = rawData['pli'];
                break;
        }

        if ( rawData['desc'] ) {
            this.description = rawData['desc'];
        }

        if ( rawData['aptp'] ) {
            this.limitProfileType = rawData['aptp'];
        }

        if ( rawData['sc'] ) {
            this.canSearchLink = rawData['sc'];
        }

        if ( rawData['ri'] ) {
            this.UNKNOWN1 = rawData['ri'];
        }

        if ( rawData['pa'] ) {
            this.UNKNOWN2 = rawData['pa'];
        }
    }

    toRawContent() {
        const obj:any = {
            'ln': this.title,
            'lip': this.linkImagePath,
            'lt': this.linkType,
            'ptp': this.profileType,
            'aptp': this.limitProfileType,
            'sc': this.canSearchLink,
            'ri': this.UNKNOWN1,
            'pa': this.UNKNOWN2,
        };

        switch ( this.profileType ) {
            case OpenchatProfileType.KAKAO_ANON:
                obj['nn'] = this.openProfile.nickname;
                obj['pp'] = this.openProfile.profilePath;
            break;
            case OpenchatProfileType.OPEN_PROFILE:
                obj['pli'] = this.profileId;
            break;
        }

        if ( this.description ) {
            obj['desc'] = this.description;
        }

        return obj;
    }
} */