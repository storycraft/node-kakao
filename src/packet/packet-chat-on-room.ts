/*
 * Created on Wed May 06 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { MemberStruct } from "../talk/struct/member-struct";
import { ChannelType } from "../talk/chat/channel-type";
import { JsonUtil } from "../util/json-util";
import { OpenMemberStruct } from "../talk/struct/open-link-struct";

export class PacketChatOnRoomReq extends LocoBsonRequestPacket {
    
    constructor(
        public ChannelId: Long = Long.ZERO,
        public Token: Long = Long.ZERO,
        public OpenChatToken: number = -1,
    ) {
        super();
    }

    get PacketName(): string {
        return 'CHATONROOM';
    }

    toBodyJson() {
        let obj: any = {
            'chatId': this.ChannelId,
            'token': this.Token
        };

        if (this.OpenChatToken !== -1) obj['opt'] = this.OpenChatToken;

        return obj;
    }

}

export class PacketChatOnRoomRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public MemberList: MemberStruct[] = [],
        public Type: ChannelType = ChannelType.UNKNOWN,
        public WatermarkList: Long[] = [],
        public OpenChatToken: number = 0,
        public ClientOpenProfile: OpenMemberStruct | null = null
    ) {
        super(status);
    }

    get PacketName(): string {
        return 'CHATONROOM';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        if (rawData['m']) {
            this.MemberList = [];
            for (let rawMem of rawData['m']) {
                let memberStruct = new MemberStruct();

                memberStruct.fromJson(rawMem);

                this.MemberList.push(memberStruct);
            }
        }

        this.Type = rawData['t'];
        if (rawData['w']) this.WatermarkList = rawData['w'];

        this.OpenChatToken = rawData['otk'];

        if (rawData['olu']) {
            this.ClientOpenProfile = new OpenMemberStruct();
            this.ClientOpenProfile.fromJson(rawData['olu']);
        } else {
            this.ClientOpenProfile = null;
        }
    }

}