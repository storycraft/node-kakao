import { LocoRequestPacket, LocoResponsePacket } from "./loco-packet-base";
import { PacketGetConfReq, PacketGetConfRes } from "./packet-get-conf";
import { PacketCheckInReq, PacketCheckInRes } from "./packet-check-in";
import { PacketLoginReq, PacketLoginRes } from "./packet-login";
import { PacketMessageRes, PacketMessageWriteReq, PacketMessageWriteRes } from "./packet-message";
import { PacketMessageReadRes } from "./packet-message-read";
import { PacketKickoutRes } from "./packet-kickout";
import { PacketInvoiceRes } from "./packet-invoice";
import { PacketNewMemberRes } from "./packet-new-member";
import { PacketLeftRes, PacketLeaveReq } from "./packet-leave";
import { PacketChatMemberReq, PacketChatMemberRes } from "./packet-chat-member";
import { PacketChatInfoReq, PacketChatInfoRes } from "./packet-chatinfo";
import { PacketChanJoinRes } from "./packet-chan-join";
import { PacketGetMemberRes, PacketGetMemberReq } from "./packet-get-member";
import { DefaultBsonRequestPacket, DefaultBsonResponsePacket } from "./loco-bson-packet";
import { PacketGetMetaReq, PacketGetMetaRes, PacketGetMetasReq, PacketGetMetasRes } from "./packet-get-meta";
import { PacketGetChannelBoardMetaReq, PacketGetMoimMetaRes } from "./packet-get-channel-board-meta";
import { PacketSyncLinkReq, PacketSyncLinkRes } from "./packet-sync-link";
import { PacketRewriteReq } from "./packet-rewrite";
import { PacketKickMemberReq } from "./packet-kick-member";
import { PacketDeleteLinkReq } from "./packet-delete-link";
import { PacketDeleteChatRes } from "./packet-delete-chat";
import { PacketMemberRes, PacketMemberReq } from "./packet-member";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoPacketList {

    private static reqeustPacketMap: Map<string, () => LocoRequestPacket>;
    private static responsePacketMap: Map<string, (status: number) => LocoResponsePacket>;

    private static defaultBodyReqPacketMap: Map<number, (packetName: string) => LocoRequestPacket>;
    private static defaultBodyResPacketMap: Map<number, (status: number, packetName: string) => LocoResponsePacket>;

    static init() {
        LocoPacketList.initReqMap();
        LocoPacketList.initResMap();
    }

    protected static initReqMap() {
        LocoPacketList.reqeustPacketMap = new Map();
        LocoPacketList.defaultBodyReqPacketMap = new Map();

        LocoPacketList.defaultBodyReqPacketMap.set(0, (packetName: string) => new DefaultBsonRequestPacket(packetName));

        LocoPacketList.reqeustPacketMap.set('GETCONF', () => new PacketGetConfReq());
        LocoPacketList.reqeustPacketMap.set('CHECKIN', () => new PacketCheckInReq());
        LocoPacketList.reqeustPacketMap.set('LOGINLIST', () => new PacketLoginReq());

        LocoPacketList.reqeustPacketMap.set('WRITE', () => new PacketMessageWriteReq());
        LocoPacketList.reqeustPacketMap.set('MEMBER', () => new PacketChatMemberReq());
        LocoPacketList.reqeustPacketMap.set('CHATINFO', () => new PacketChatInfoReq());

        LocoPacketList.reqeustPacketMap.set('GETMETA', () => new PacketGetMetaReq());
        LocoPacketList.reqeustPacketMap.set('GETMETAS', () => new PacketGetMetasReq());
        LocoPacketList.reqeustPacketMap.set('GETMEM', () => new PacketGetMemberReq());
        LocoPacketList.reqeustPacketMap.set('MEMBER', () => new PacketMemberReq());
        LocoPacketList.reqeustPacketMap.set('GETMOMETA', () => new PacketGetChannelBoardMetaReq());

        LocoPacketList.reqeustPacketMap.set('SYNCLINK', () => new PacketSyncLinkReq());
        
        LocoPacketList.reqeustPacketMap.set('REWRITE', () => new PacketRewriteReq());

        LocoPacketList.reqeustPacketMap.set('KICKMEM', () => new PacketKickMemberReq());
        LocoPacketList.reqeustPacketMap.set('DELETELINK', () => new PacketDeleteLinkReq());

        LocoPacketList.reqeustPacketMap.set('DELETEMSG', () => new PacketDeleteLinkReq());

        LocoPacketList.reqeustPacketMap.set('LEAVE', () => new PacketLeaveReq());
    }

    protected static initResMap() {
        LocoPacketList.responsePacketMap = new Map();
        LocoPacketList.defaultBodyResPacketMap = new Map();

        LocoPacketList.defaultBodyResPacketMap.set(0, (status: number, packetName: string) => new DefaultBsonResponsePacket(status, packetName));

        LocoPacketList.responsePacketMap.set('GETCONF', (status) => new PacketGetConfRes(status));
        LocoPacketList.responsePacketMap.set('CHECKIN', (status) => new PacketCheckInRes(status));

        LocoPacketList.responsePacketMap.set('LOGINLIST', (status) => new PacketLoginRes(status));

        LocoPacketList.responsePacketMap.set('MSG', (status) => new PacketMessageRes(status));
        LocoPacketList.responsePacketMap.set('WRITE', (status) => new PacketMessageWriteRes(status));
        LocoPacketList.responsePacketMap.set('DECUNREAD', (status) => new PacketMessageReadRes(status));
        LocoPacketList.responsePacketMap.set('MEMBER', (status) => new PacketChatMemberRes(status));
        LocoPacketList.responsePacketMap.set('CHATINFO', (status) => new PacketChatInfoRes(status));

        LocoPacketList.responsePacketMap.set('GETMETA', (status) => new PacketGetMetaRes(status));
        LocoPacketList.responsePacketMap.set('GETMETAS', (status) => new PacketGetMetasRes(status));
        LocoPacketList.responsePacketMap.set('GETMEM', (status) => new PacketGetMemberRes(status));
        LocoPacketList.responsePacketMap.set('MEMBER', (status) => new PacketMemberRes(status));
        LocoPacketList.responsePacketMap.set('GETMOMETA', (status) => new PacketGetMoimMetaRes(status));

        LocoPacketList.responsePacketMap.set('NEWMEM', (status) => new PacketNewMemberRes(status));
        LocoPacketList.responsePacketMap.set('LEFT', (status) => new PacketLeftRes(status));
        LocoPacketList.responsePacketMap.set('SYNCJOIN', (status) => new PacketChanJoinRes(status));

        LocoPacketList.responsePacketMap.set('SYNCLINK', (status) => new PacketSyncLinkRes(status));

        LocoPacketList.responsePacketMap.set('INVOICE', (status) => new PacketInvoiceRes(status));

        LocoPacketList.responsePacketMap.set('DELETEMSG', (status) => new PacketDeleteChatRes(status));

        LocoPacketList.responsePacketMap.set('KICKOUT', (status) => new PacketKickoutRes(status));
    }

    static hasReqPacket(name: string): boolean {
        return LocoPacketList.reqeustPacketMap && LocoPacketList.reqeustPacketMap.has(name);
    }

    static hasResPacket(name: string): boolean {
        return LocoPacketList.responsePacketMap && LocoPacketList.responsePacketMap.has(name);
    }

    static hasReqBodyType(type: number): boolean {
        return LocoPacketList.defaultBodyReqPacketMap && LocoPacketList.defaultBodyReqPacketMap.has(type);
    }

    static hasResBodyType(type: number): boolean {
        return LocoPacketList.defaultBodyResPacketMap && LocoPacketList.defaultBodyResPacketMap.has(type);
    }

    static getReqPacketByName(name: string): LocoRequestPacket {
        if (!LocoPacketList.hasReqPacket(name)) {
            throw new Error(`${name} is not valid loco request packet`);
        }

        return LocoPacketList.reqeustPacketMap.get(name)!();
    }

    static getResPacketByName(name: string, status: number): LocoResponsePacket {
        if (!LocoPacketList.hasResPacket(name)) {
            throw new Error(`${name} is not valid loco response packet`);
        }

        return LocoPacketList.responsePacketMap.get(name)!(status);
    }

    static getDefaultReqPacket(bodyType: number, packetName: string): LocoRequestPacket {
        if (!LocoPacketList.hasReqBodyType(bodyType)) {
            throw new Error(`${bodyType} is not valid loco packet type`);
        }

        return LocoPacketList.defaultBodyReqPacketMap.get(bodyType)!(packetName);
    }

    static getDefaultResPacket(bodyType: number, packetName: string, status: number): LocoResponsePacket {
        if (!LocoPacketList.hasResBodyType(bodyType)) {
            throw new Error(`${bodyType} is not valid loco packet type`);
        }

        return LocoPacketList.defaultBodyResPacketMap.get(bodyType)!(status, packetName);
    }


}

LocoPacketList.init();