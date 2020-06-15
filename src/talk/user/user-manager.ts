/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { IdStore } from "../../store/store";
import { ChatUser, ChatUserInfo, OpenChatUserInfo } from "./chat-user";
import { Long } from "bson";
import { LocoClient } from "../../client";
import { MemberStruct } from "../struct/member-struct";
import { PacketGetMemberRes, PacketGetMemberReq } from "../../packet/packet-get-member";
import { PacketMemberReq } from "../../packet/packet-member";
import { OpenMemberStruct } from "../struct/open/open-link-struct";
import { ChatChannel } from "../channel/chat-channel";
import { ManagedChatUser, ManagedChatUserInfo, ManagedOpenChatUserInfo } from "../managed/managed-chat-user";

export class UserManager extends IdStore<ChatUser> {

    constructor(private client: LocoClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    protected fetchValue(key: Long): ManagedChatUser {
        return new ManagedChatUser(this, key);
    }

    get(key: Long): ChatUser {
        if (this.client.ClientUser && this.client.ClientUser.Id.equals(key)) return this.client.ClientUser;

        return super.get(key, true);
    }

    getFromStruct(memberStruct: MemberStruct | OpenMemberStruct): ChatUserInfo | OpenChatUserInfo {
        if ((memberStruct as OpenMemberStruct).openToken) return new ManagedOpenChatUserInfo(this, this.get(memberStruct.userId), memberStruct as OpenMemberStruct);
    
        return new ManagedChatUserInfo(this, this.get(memberStruct.userId), memberStruct as MemberStruct);
    }

    async requestAllUserInfoList(channel: ChatChannel): Promise<ChatUserInfo[]> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMemberRes>(new PacketGetMemberReq(channel.Id));

        return res.MemberList.map(this.getFromStruct.bind(this));
    }

    async requestUserInfoList(channel: ChatChannel, idList: Long[]): Promise<ChatUserInfo[]> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketGetMemberRes>(new PacketMemberReq(channel.Id, idList));

        return res.MemberList.map(this.getFromStruct.bind(this));
    }

    initalizeClient() {
        this.clear();
    }

}
