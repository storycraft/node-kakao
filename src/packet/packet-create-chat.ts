import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { ChatInfoStruct } from "../talk/struct/chat-info-struct";
import { JsonUtil } from "../util/json-util";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Wed Mar 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketCreateChatReq extends LocoBsonRequestPacket {

    constructor(
        public UserIdList: Long[] = [],
        public Nickname: string = '',
        public ProfileURL: string = ''
        ) {
        super();
    }

    get PacketName() {
        return 'CREATE';
    }

    toBodyJson(): any {
        let obj: any = {
            'memberIds': this.UserIdList
        };

        if (this.Nickname !== '') obj['nickname'] = this.Nickname;
        if (this.ProfileURL !== '') obj['profileImageUrl'] = this.ProfileURL;

        return obj;
    }

}

export class PacketCreateChatRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.ZERO,
        public ChatInfo?: ChatInfoStruct
        ) {
            super(status);
    }

    get PacketName() {
        return 'CREATE';
    }
    
    readBodyJson(rawBody: any) {
        this.ChannelId = JsonUtil.readLong(rawBody['chatId']);

        if (rawBody['chatRoom']) this.ChatInfo = Serializer.deserialize<ChatInfoStruct>(rawBody['chatRoom'], ChatInfoStruct.MAPPER);
    }

}