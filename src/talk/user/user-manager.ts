/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { IdInstanceStore } from "../../store/store";
import { ChatUser, ChatUserInfo, OpenChatUserInfo, DisplayUserInfo } from "./chat-user";
import { Long } from "bson";
import { LocoClient } from "../../client";
import { MemberStruct, DisplayMemberStruct } from "../struct/member-struct";
import { PacketGetMemberRes, PacketGetMemberReq } from "../../packet/packet-get-member";
import { PacketMemberReq, PacketMemberRes } from "../../packet/packet-member";
import { OpenMemberStruct } from "../struct/open/open-link-struct";
import { ChatChannel } from "../channel/chat-channel";
import { ManagedChatUser, ManagedChatUserInfo, ManagedOpenChatUserInfo } from "../managed/managed-chat-user";
import { RequestResult } from "../request/request-result";

export class UserManager extends IdInstanceStore<ChatUser> {

    constructor(private client: LocoClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    protected createInstanceFor(key: Long): ManagedChatUser {
        return new ManagedChatUser(this, key);
    }

    get(key: Long): ChatUser {
        if (this.client.ClientUser && this.client.ClientUser.Id.equals(key)) return this.client.ClientUser;

        return super.get(key)!;
    }

    getInfoFromStruct(memberStruct: MemberStruct | OpenMemberStruct): ChatUserInfo | OpenChatUserInfo {
        if ((memberStruct as OpenMemberStruct).openToken) return new ManagedOpenChatUserInfo(this, this.get(memberStruct.userId), memberStruct as OpenMemberStruct);

        return new ManagedChatUserInfo(this, this.get(memberStruct.userId), memberStruct as MemberStruct);
    }

    async requestAllUserInfoList(channel: ChatChannel): Promise<RequestResult<ChatUserInfo[]>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMemberRes>(new PacketGetMemberReq(channel.Id));

        return { status: res.StatusCode, result: res.MemberList.map(this.getInfoFromStruct.bind(this)) };
    }

    async requestUserInfoList(channel: ChatChannel, idList: Long[]): Promise<RequestResult<ChatUserInfo[]>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketMemberRes>(new PacketMemberReq(channel.Id, idList));

        return { status: res.StatusCode, result: res.MemberList.map(this.getInfoFromStruct.bind(this)) };
    }

    async requestUserInfo(channel: ChatChannel, id: Long): Promise<RequestResult<ChatUserInfo>> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketMemberRes>(new PacketMemberReq(channel.Id, [ id ]));

        let memberStruct = res.MemberList[0];

        if (!memberStruct) return { status: res.StatusCode };

        return { status: res.StatusCode, result: this.getInfoFromStruct(memberStruct) };
    }

    initalizeClient() {
        this.clear();
    }

}
