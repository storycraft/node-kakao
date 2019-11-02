import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { MessageType } from "../talk/chat/message-type";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";
import { JsonUtil } from "../util/json-util";
import { Long } from "bson";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */
export class PacketMessageWriteReq extends LocoBsonRequestPacket {

    constructor(
        public MessageId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public Text: string = '',
        public Type: MessageType = MessageType.Text,
        public NoSeen: boolean = false,
        public Extra: string = ''
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

        if (this.Extra !== '') {
            obj.extra = this.Extra;
        }

        return obj;
    }
}

export class PacketMessageRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public ChannelId: Long = Long.fromNumber(-1),
        public SenderNickname: string = '',
        public Chatlog: ChatlogStruct = new ChatlogStruct(),
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

        this.Chatlog = new ChatlogStruct();

        if (body['chatLog']) {
            this.Chatlog.fromJson(body['chatLog']);
        }
    }

}