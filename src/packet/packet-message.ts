import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";
import { MessageType } from "../talk/chat/message-type";
import { ChatlogStruct } from "../talk/struct/chatlog-struct";

/*
 * Created on Tue Oct 29 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */
export class PacketMessageWriteReq extends LocoBsonRequestPacket {

    constructor(
        public MessageId: number = 0,
        public ChannelId: number = 0,
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
        public ChannelId: number = -1,
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