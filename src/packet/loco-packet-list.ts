import { LocoRequestPacket, LocoResponsePacket } from "./loco-packet-base";
import { PacketGetConfReq, PacketGetConfRes } from "./booking/packet-get-conf";
import { PacketCheckInReq, PacketCheckInRes } from "./checkin/packet-check-in";
import { PacketLoginReq, PacketLoginRes } from "./packet-login";
import { PacketMessageRes, PacketMessageWriteReq, PacketMessageWriteRes } from "./packet-message";
import { PacketMessageReadRes } from "./packet-message-read";
import { PacketKickoutRes } from "./packet-kickout";
import { PacketInvoiceRes } from "./packet-invoice";
import { PacketNewMemberRes } from "./packet-new-member";
import { PacketLeftRes, PacketLeaveReq, PacketLeaveRes } from "./packet-leave";
import { PacketChatMemberReq, PacketChatMemberRes } from "./packet-chat-member";
import { PacketChatInfoReq, PacketChatInfoRes } from "./packet-chatinfo";
import { PacketChanJoinRes } from "./packet-chan-join";
import { PacketGetMemberRes, PacketGetMemberReq } from "./packet-get-member";
import { DefaultBsonRequestPacket, DefaultBsonResponsePacket } from "./loco-bson-packet";
import { PacketGetMetaReq, PacketGetMetaRes, PacketGetMetaListReq, PacketGetMetaListRes } from "./packet-get-meta";
import { PacketGetChannelBoardMetaReq, PacketGetMoimMetaRes } from "./packet-get-channel-board-meta";
import { PacketSyncLinkReq, PacketSyncLinkRes } from "./packet-sync-link";
import { PacketRewriteReq, PacketRewriteRes } from "./packet-rewrite";
import { PacketKickMemberReq, PacketKickMemberRes } from "./packet-kick-member";
import { PacketDeleteLinkReq, PacketDeleteLinkRes } from "./packet-delete-link";
import { PacketDeleteChatRes } from "./packet-delete-chat";
import { PacketMemberRes, PacketMemberReq } from "./packet-member";
import { PacketPingRes, PacketPingReq } from "./packet-ping";
import { PacketInfoLinkRes, PacketInfoLinkReq } from "./packet-info-link";
import { PacketCreateChatRes, PacketCreateChatReq } from "./packet-create-chat";
import { PacketSyncJoinOpenchatRes } from "./packet-sync-join-openchat";
import { PacketDeleteMemberRes } from "./packet-delmem";
import { PacketMessageNotiReadReq, PacketMessageNotiReadRes } from "./packet-noti-read";
import { PacketJoinInfoReq, PacketJoinInfoRes } from "./packet-join-info";
import { PacketSetMemTypeRes, PacketSetMemTypeReq } from "./packet-set-mem-type";
import { PacketLinkKickedRes } from "./packet-link-kicked";
import { PacketJoinLinkRes, PacketJoinLinkReq } from "./packet-join-link";
import { PacketUpdateLinkProfileReq, PacketUpdateLinkProfileRes } from "./packet-update-link-profile";
import { PacketSyncMemberTypeRes } from "./packet-sync-member-type";
import { PacketChatOnRoomReq, PacketChatOnRoomRes } from "./packet-chat-on-room";
import { PacketSyncProfileRes } from "./packet-sync-profile";
import { PacketSyncDeleteMessageRes } from "./packet-sync-delete-message";
import { PacketSyncMessageReq, PacketSyncMessageRes } from "./packet-sync-message";
import { PacketGetTrailerReq, PacketGetTrailerRes } from "./packet-get-trailer";
import { PacketShipReq, PacketShipRes } from "./packet-ship";
import { PacketGetToken } from "./packet-get-token";
import { PacketMultiChatlogReq, PacketMultiChatlogRes } from "./packet-multi-chatlog";
import { PacketSetStatusReq, PacketSetStatusRes } from "./packet-set-status";
import { PacketUpdateChannelReq, PacketUpdateChannelRes } from "./packet-update-channel";
import { PacketBuyCallServerReq, PacketBuyCallServerRes } from "./checkin/packet-buy-call-server";
import { PacketChannelListReq, PacketChannelListRes } from "./packet-channel-list";
import { PacketSetMetaReq, PacketSetMetaRes } from "./packet-set-meta";
import { PacketSetClientMetaReq, PacketSetClientMetaRes } from "./packet-set-client-meta";
import { PacketMetaChangeRes } from "./packet-meta-change";
import { PacketGetClientMetaRes, PacketGetClientMetaReq } from "./packet-get-client-meta";
import { PacketChangeServerRes } from "./packet-change-server";
import { PacketCompleteRes } from "./media/packet-complete";
import { PacketPostReq, PacketPostRes } from "./media/packet-post";
import { PacketMiniReq, PacketMiniRes } from "./media/packet-mini";
import { PacketDownReq, PacketDownRes } from "./media/packet-down";
import { PacketCreateOpenLinkReq, PacketCreateOpenLinkRes } from "./packet-create-open-link";
import { PacketUpdateOpenChannelReq, PacketUpdateOpenChannelRes } from "./packet-update-link-info";


/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export namespace LocoPacketList {

    let requestPacketMap: Map<string, new() => LocoRequestPacket> = new Map();
    let responsePacketMap: Map<string, new(status: number) => LocoResponsePacket> = new Map();

    let defaultBodyReqPacketMap: Map<number, new(packetName: string) => LocoRequestPacket> = new Map();
    let defaultBodyResPacketMap: Map<number, new(status: number, packetName: string) => LocoResponsePacket>;

    function initReqMap() {
        defaultBodyReqPacketMap.set(0, DefaultBsonRequestPacket);

        requestPacketMap.set('GETCONF', PacketGetConfReq);

        requestPacketMap.set('CHECKIN', PacketCheckInReq);
        requestPacketMap.set('BUYCS', PacketBuyCallServerReq);

        requestPacketMap.set('LCHATLIST', PacketChannelListReq);

        requestPacketMap.set('LOGINLIST', PacketLoginReq);
        requestPacketMap.set('SETST', PacketSetStatusReq);

        requestPacketMap.set('GETTOKEN', PacketGetToken);

        requestPacketMap.set('MCHATLOGS', PacketMultiChatlogReq);

        requestPacketMap.set('WRITE', PacketMessageWriteReq);
        requestPacketMap.set('MEMBER', PacketChatMemberReq);
        requestPacketMap.set('CHATINFO', PacketChatInfoReq);

        requestPacketMap.set('UPDATECHAT', PacketUpdateChannelReq);

        requestPacketMap.set('GETTRAILER', PacketGetTrailerReq);

        requestPacketMap.set('SHIP', PacketShipReq);
        requestPacketMap.set('POST', PacketPostReq);

        requestPacketMap.set('MINI', PacketMiniReq);
        requestPacketMap.set('DOWN', PacketDownReq);

        requestPacketMap.set('GETMETA', PacketGetMetaReq);
        requestPacketMap.set('GETMCMETA', PacketGetClientMetaReq);
        requestPacketMap.set('GETMETAS', PacketGetMetaListReq);
        requestPacketMap.set('SETMETA', PacketSetMetaReq);
        requestPacketMap.set('SETMCMETA', PacketSetClientMetaReq);
        requestPacketMap.set('GETMEM', PacketGetMemberReq);
        requestPacketMap.set('MEMBER', PacketMemberReq);
        requestPacketMap.set('GETMOMETA', PacketGetChannelBoardMetaReq);

        requestPacketMap.set('SYNCLINK', PacketSyncLinkReq);
        
        requestPacketMap.set('REWRITE', PacketRewriteReq);

        requestPacketMap.set('CREATE', PacketCreateChatReq);

        requestPacketMap.set('KICKMEM', PacketKickMemberReq);
        requestPacketMap.set('DELETELINK', PacketDeleteLinkReq);
        requestPacketMap.set('INFOLINK', PacketInfoLinkReq);
        requestPacketMap.set('JOININFO', PacketJoinInfoReq);
        requestPacketMap.set('SETMEMTYPE', PacketSetMemTypeReq);
        requestPacketMap.set('JOINLINK', PacketJoinLinkReq);
        requestPacketMap.set('UPLINKPROF', PacketUpdateLinkProfileReq);

        requestPacketMap.set('SYNCMSG', PacketSyncMessageReq);

        requestPacketMap.set('DELETEMSG', PacketDeleteLinkReq);

        requestPacketMap.set('NOTIREAD', PacketMessageNotiReadReq);
        requestPacketMap.set('CHATONROOM', PacketChatOnRoomReq);

        requestPacketMap.set('PING', PacketPingReq);

        requestPacketMap.set('LEAVE', PacketLeaveReq);

        requestPacketMap.set('CREATELINK', PacketCreateOpenLinkReq);
        requestPacketMap.set('UPDATELINK', PacketUpdateOpenChannelReq);
    }

    function initResMap() {
        responsePacketMap = new Map();
        defaultBodyResPacketMap = new Map();

        defaultBodyResPacketMap.set(0, DefaultBsonResponsePacket);
        defaultBodyResPacketMap.set(8, DefaultBsonResponsePacket); // ??

        responsePacketMap.set('GETCONF', PacketGetConfRes);

        responsePacketMap.set('CHECKIN', PacketCheckInRes);
        responsePacketMap.set('BUYCS', PacketBuyCallServerRes);

        responsePacketMap.set('LCHATLIST', PacketChannelListRes);

        responsePacketMap.set('LOGINLIST', PacketLoginRes);
        responsePacketMap.set('SETST', PacketSetStatusRes);

        responsePacketMap.set('MCHATLOGS', PacketMultiChatlogRes);

        responsePacketMap.set('MSG', PacketMessageRes);
        responsePacketMap.set('WRITE', PacketMessageWriteRes);

        responsePacketMap.set('GETTRAILER', PacketGetTrailerRes);

        responsePacketMap.set('SHIP', PacketShipRes);
        responsePacketMap.set('POST', PacketPostRes);

        responsePacketMap.set('MINI', PacketMiniRes);
        responsePacketMap.set('DOWN', PacketDownRes);

        responsePacketMap.set('COMPLETE', PacketCompleteRes);

        responsePacketMap.set('NOTIREAD', PacketMessageNotiReadRes);
        responsePacketMap.set('DECUNREAD', PacketMessageReadRes);
        responsePacketMap.set('MEMBER', PacketChatMemberRes);
        responsePacketMap.set('CHATINFO', PacketChatInfoRes);

        responsePacketMap.set('UPDATECHAT', PacketUpdateChannelRes);

        responsePacketMap.set('GETMETA', PacketGetMetaRes);
        responsePacketMap.set('GETMCMETA', PacketGetClientMetaRes);
        responsePacketMap.set('GETMETAS', PacketGetMetaListRes);
        responsePacketMap.set('SETMETA', PacketSetMetaRes);
        responsePacketMap.set('SETMCMETA', PacketSetClientMetaRes);
        responsePacketMap.set('CHGMETA', PacketMetaChangeRes);
        responsePacketMap.set('GETMEM', PacketGetMemberRes);
        responsePacketMap.set('MEMBER', PacketMemberRes);
        responsePacketMap.set('GETMOMETA', PacketGetMoimMetaRes);

        responsePacketMap.set('JOININFO', PacketJoinInfoRes);

        responsePacketMap.set('KICKMEM', PacketKickMemberRes);

        responsePacketMap.set('CREATE', PacketCreateChatRes);

        responsePacketMap.set('NEWMEM', PacketNewMemberRes);
        responsePacketMap.set('LEFT', PacketLeftRes);
        responsePacketMap.set('LEAVE', PacketLeaveRes);
        responsePacketMap.set('SYNCJOIN', PacketChanJoinRes);

        responsePacketMap.set('SYNCLINK', PacketSyncLinkRes);
        responsePacketMap.set('INFOLINK', PacketInfoLinkRes);
        responsePacketMap.set('DELETELINK', PacketDeleteLinkRes);
        responsePacketMap.set('REWRITE', PacketRewriteRes);
        responsePacketMap.set('SETMEMTYPE', PacketSetMemTypeRes);
        responsePacketMap.set('LINKKICKED', PacketLinkKickedRes);
        responsePacketMap.set('JOINLINK', PacketJoinLinkRes);
        responsePacketMap.set('UPLINKPROF', PacketUpdateLinkProfileRes);

        responsePacketMap.set('SYNCLINKPF', PacketSyncProfileRes);

        responsePacketMap.set('CHATONROOM', PacketChatOnRoomRes);

        responsePacketMap.set('SYNCMEMT', PacketSyncMemberTypeRes);

        responsePacketMap.set('INVOICE', PacketInvoiceRes);

        responsePacketMap.set('DELETEMSG', PacketDeleteChatRes);
        responsePacketMap.set('SYNCDLMSG', PacketSyncDeleteMessageRes);

        responsePacketMap.set('SYNCLINKCR', PacketSyncJoinOpenchatRes);

        responsePacketMap.set('SYNCMSG', PacketSyncMessageRes);

        responsePacketMap.set('DELMEM', PacketDeleteMemberRes);

        responsePacketMap.set('PING', PacketPingRes);

        responsePacketMap.set('CHANGESVR', PacketChangeServerRes);
        responsePacketMap.set('KICKOUT', PacketKickoutRes);

        responsePacketMap.set('CREATELINK', PacketCreateOpenLinkRes);
        responsePacketMap.set('UPDATELINK', PacketUpdateOpenChannelRes);
    }

    export function hasReqPacket(name: string): boolean {
        return requestPacketMap && requestPacketMap.has(name);
    }

    export function hasResPacket(name: string): boolean {
        return responsePacketMap && responsePacketMap.has(name);
    }

    export function hasReqBodyType(type: number): boolean {
        return defaultBodyReqPacketMap && defaultBodyReqPacketMap.has(type);
    }

    export function hasResBodyType(type: number): boolean {
        return defaultBodyResPacketMap && defaultBodyResPacketMap.has(type);
    }

    export function getReqPacketByName(name: string): LocoRequestPacket {
        if (!LocoPacketList.hasReqPacket(name)) {
            throw new Error(`${name} is not valid loco request packet`);
        }

        return new (requestPacketMap.get(name)!)();
    }

    export function getResPacketByName(name: string, status: number): LocoResponsePacket {
        if (!LocoPacketList.hasResPacket(name)) {
            throw new Error(`${name} is not valid loco response packet`);
        }

        return new (responsePacketMap.get(name)!)(status);
    }

    export function getDefaultReqPacket(bodyType: number, packetName: string): LocoRequestPacket {
        if (!LocoPacketList.hasReqBodyType(bodyType)) {
            throw new Error(`${bodyType} is not valid loco packet type`);
        }

        return new (defaultBodyReqPacketMap.get(bodyType)!)(packetName);
    }

    export function getDefaultResPacket(bodyType: number, packetName: string, status: number): LocoResponsePacket {
        if (!LocoPacketList.hasResBodyType(bodyType)) {
            throw new Error(`${bodyType} is not valid loco packet type`);
        }

        return new (defaultBodyResPacketMap.get(bodyType)!)(status, packetName);
    }

    initReqMap();
    initResMap();

}
