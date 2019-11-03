import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "..";
import { MemberStruct } from "../talk/struct/member-struct";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketGetMemberReq extends LocoBsonRequestPacket {

    constructor(
        public ChannelId: Long = Long.ZERO
    ) {
        super();
    }

    get PacketName() {
        return 'GETMEM';
    }

    toBodyJson() {
        return {
            'chatId': this.ChannelId
        };
    }

}

export class PacketGetMemberRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public MemberList: MemberStruct[] = []
    ) {
        super(status);
    }

    get PacketName() {
        return 'GETMEM';
    }

    readBodyJson(json: any) {
        this.MemberList = [];
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