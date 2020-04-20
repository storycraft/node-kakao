import { StructBase } from "./struct-base";
import { MessageType } from "../chat/message-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatlogStruct implements StructBase {

    constructor(
        public LogId: Long = Long.ZERO,
        public PrevLogId: Long = Long.ZERO,
        public SenderId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
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

        this.MessageId = parseInt(rawJson['msgId'], 10);
        
        this.Type = rawJson['type'];

        this.Text = rawJson['message'] || '';

        this.RawAttachment = rawJson['attachment'] || '{}';

        this.SendTime = rawJson['sendAt'];
    }

    toJson() {
        return {
            'logId': this.LogId,
            'prevId': this.PrevLogId,
            'authorId': this.SenderId,
            'chatId': this.ChannelId,
            'msgId': this.MessageId,
            't': this.Type,
            'message': this.Text,
            'attachment': this.RawAttachment,
            'sendAt': this.SendTime
        };
    }

}