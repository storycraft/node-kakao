import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { MemberStruct } from "../talk/struct/member-struct";
import { JsonUtil } from "../util/json-util";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketChatMemberReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: number = 0,
        public UserIdLIst: number[] = []
    ) {
        super();
    }

    get PacketName() {
        return 'MEMBER';
    }

    toBodyJson() {
        let idList: any[] = [];

        for (let id of this.UserIdLIst) {
            idList.push(JsonUtil.writeLong(id));
        }

        return {
            'chatId': JsonUtil.writeLong(this.ChannelId),
            'memberIds': idList
        };
    }

}

export class PacketChatMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: number = 0,
        public MemberList: MemberStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'MEMBER';
    }

    readBodyJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['chatId']);

        this.MemberList = [];
        if (rawData['members']) {
            let memberList: any[] = rawData['members'];

            for (let rawMemberStruct of memberList) {
                let memberStruct = new MemberStruct();
                memberStruct.fromJson(rawMemberStruct);

                this.MemberList.push(memberStruct);
            }
        }
    }

}