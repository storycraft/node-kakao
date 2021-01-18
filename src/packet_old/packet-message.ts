import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatType } from "../talk/chat_old/chat-type";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";
import { Serializer } from "json-proxy-mapper";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */
export class PacketMessageWriteReq extends LocoBsonRequestPacket {

    constructor(
        public MessageId: number = 0,
        public ChannelId: Long = Long.ZERO,
        public Text: string = '',
        public Type: ChatType = ChatType.Text,
        public NoSeen: boolean = false,
        public Extra: string = '',
        public Supplement: string = ''
    ) {
        super();
    }
    
    get PacketName() {
        return 'WRITE';
    }
    
    toBodyJson() {
        let obj: any = {
            'chatId': this.ChannelId,
            'msgId': this.MessageId,
            'msg': this.Text,
            'type': this.Type,
            'noSeen': this.NoSeen
        };

        if (this.Extra !== '') obj['extra'] = this.Extra;

        if (this.Supplement !== '') obj['supplement'] = this.Supplement;

        return obj;
    }
}

export class PacketMessageWriteRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public MessageId: number = 0,
        public ChannelId: Long = Long.ZERO,
        public LogId: Long = Long.ZERO,
        public PrevLogId: Long = Long.ZERO,
        public SenderNickname: string = '',
        public Chatlog?: ChatlogStruct,
        public SendTime: number = -1
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'WRITE';
    }
    
    readBodyJson(body: any) {
        this.MessageId = body['msgId'];
        this.ChannelId = JsonUtil.readLong(body['chatId']);
        this.LogId = JsonUtil.readLong(body['logId']);
        this.PrevLogId = JsonUtil.readLong(body['prevId']);
        this.SendTime = body['sendAt'];

        if (body['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(body['chatLog'], ChatlogStruct.MAPPER);
        }
    }
}

export class PacketMessageRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.fromNumber(-1),
        public SenderNickname: string = '',
        public Chatlog?: ChatlogStruct,
        public NoSeen: boolean = false,
        public PushAlert: boolean = false
    ) {
        super(status);
    }
    
    get PacketName() {
        return 'MSG';
    }
    
    readBodyJson(body: any) {
        this.ChannelId = JsonUtil.readLong(body['chatId']);
        this.SenderNickname = body['authorNickname'];

        this.PushAlert = body['pushAlert'];
        this.NoSeen = body['noSeen'];

        if (body['chatLog']) {
            this.Chatlog = Serializer.deserialize<ChatlogStruct>(body['chatLog'], ChatlogStruct.MAPPER);
        }
    }

}