/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SessionManager } from "../session/session-manager";
import { OpenLinkStruct } from "../struct/open-link-struct";
import { PacketJoinInfoReq, PacketJoinInfoRes } from "../../packet/packet-join-info";
import { Long } from "bson";
import { PacketInfoLinkRes, PacketInfoLinkReq } from "../../packet/packet-info-link";

export class OpenChatManager {
    
    private clientProfileMap: Map<string, OpenLinkStruct>;

    constructor(private sessionManager: SessionManager) {
        this.clientProfileMap = new Map();
    }

    get SessionManager() {
        return this.sessionManager;
    }

    get NetworkManager() {
        return this.sessionManager.Client.NetworkManager;
    }

    async getOpenInfoFromId(...linkId: Long[]): Promise<OpenLinkStruct[]> {
        let res = await this.NetworkManager.requestPacketRes<PacketInfoLinkRes>(new PacketInfoLinkReq(linkId));

        return res.LinkList;
    }
    
    async getOpenInfoFromURL(openLinkURL: string): Promise<OpenLinkStruct> {
        let res = await this.NetworkManager.requestPacketRes<PacketJoinInfoRes>(new PacketJoinInfoReq(openLinkURL, 'EW'));

        return res.OpenLink;
    }

}