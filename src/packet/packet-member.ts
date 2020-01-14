import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { JsonUtil } from "../util/json-util";
import { MemberStruct } from "../talk/struct/member-struct";

/*
 * Created on Tue Jan 14 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketMemberReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public MemberIdList: Long[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'MEMBER';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId,
            'memberIds': this.MemberIdList
        };
    }

}

export class PacketMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChatId: Long = Long.ZERO,
        public MemberList: MemberStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'MEMBER';
    }

    readBodyJson(json: any) {
        this.MemberList = [];
        
        this.ChatId = JsonUtil.readLong(json['chatId']);

        if (json['members']) {
            let memberList: any[] = json['members'];

            for (let rawMemberStruct of memberList) {
                let memberStruct = new MemberStruct();
                memberStruct.fromJson(rawMemberStruct);

                this.MemberList.push(memberStruct);
            }
        }
    }

} 