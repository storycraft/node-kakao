import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { JsonUtil } from "../util/json-util";

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
        public MessageId: number = -1,
        public ChannelId: number = -1,
        public SenderId: number = -1,
        public SenderNickname: string = '',
        public Text: string = '',
        public SentTime: number = -1,
        public Type: MessageType = MessageType.Text,
        public AttachmentInfo: string = '{}',
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
            let chatLog = body['chatLog'];

            this.SenderId = JsonUtil.readLong(chatLog['authorId']);
            this.Text = chatLog['message'];
            this.Type = chatLog['type'];
            this.AttachmentInfo = chatLog['attachment'] || '{}';

            this.SentTime = chatLog['sendAt'];
            
            this.MessageId = chatLog['msgId'];
        }
    }

}

export enum MessageType {
    Feed = 0,
    Text = 1,
    Photo = 2,
    Video = 3,
    Contact = 4,
    Audio = 5,
    DitemEmoticon = 6,
    DitemGift = 7,
    DitemImg = 8,
    KakaoLink = 9,
    Avatar = 11,
    Sticker = 12,
    Schedule = 13,
    Vote = 14,
    Lottery = 15,
    Location = 16,
    Profile = 17,
    File = 18,
    StickerAni = 20,
    Nudge = 21,
    Actioncon = 22,
    Search = 23,
    Mvoip = 51,
    PlusFriend = 81,
    PlusFriendViral = 83,
    Template = 90,
    ApiTemplate = 91,
}