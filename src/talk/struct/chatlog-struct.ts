import { StructBase } from "./struct-base";
import { MessageType } from "../chat/message-type";
import { JsonUtil } from "../../util/json-util";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatlogStruct implements StructBase {

    constructor(
        public LogId: number = 0,
        public PrevLogId: number = 0,
        public SenderId: number = 0,
        public ChannelId: number = 0,
        public Type: MessageType = MessageType.Text,
        public Text: string = '',
        public SendTime: number = -1,
        public RawAttachment: string = '',
        public MessageId: number = 0,
    ) {

    }
    
    fromJson(rawJson: any) {
        this.LogId = JsonUtil.readLong(rawJson['logId']);
        this.PrevLogId = JsonUtil.readLong(rawJson['prevId']);

        this.SenderId = JsonUtil.readLong(rawJson['authorId']);
        this.ChannelId = JsonUtil.readLong(rawJson['chatId']);

        this.MessageId = rawJson['msgId'];
        
        this.Type = rawJson['t'];

        this.Text = rawJson['message'];

        this.RawAttachment = rawJson['attachment'];

        this.SendTime = rawJson['sendAt'];
    }

    toJson() {
        return {
            'logId': JsonUtil.writeLong(this.LogId),
            'prevId': JsonUtil.writeLong(this.PrevLogId),
            'authorId': JsonUtil.writeLong(this.SenderId),
            'chatId': JsonUtil.writeLong(this.ChannelId),
            'msgId': this.MessageId,
            't': this.Type,
            'message': this.Text,
            'attachment': this.RawAttachment,
            'sendAt': this.SendTime
        };
    }

}