import { StructBase, StructBaseOld } from "./struct-base";
import { ChatType } from "../chat/chat-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { ObjectMapper } from "json-proxy-mapper";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatlogStruct implements StructBaseOld {

    constructor(
        public logId: Long = Long.ZERO,
        public prevLogId: Long = Long.ZERO,
        public senderId: Long = Long.ZERO,
        public channelId: Long = Long.ZERO,
        public type: ChatType = ChatType.Text,
        public text: string = '',
        public sendTime: number = -1,
        public rawAttachment: string = '',
        public messageId: number = 0,
    ) {

    }
    
    fromJson(rawJson: any) {
        this.logId = JsonUtil.readLong(rawJson['logId']);
        this.prevLogId = JsonUtil.readLong(rawJson['prevId']);

        this.senderId = JsonUtil.readLong(rawJson['authorId']);
        this.channelId = JsonUtil.readLong(rawJson['chatId']);

        this.messageId = parseInt(rawJson['msgId'], 10);

        this.type = rawJson['type'];

        this.text = rawJson['message'] || '';

        this.rawAttachment = rawJson['attachment'] || '{}';

        this.sendTime = rawJson['sendAt'];
    }

    toJson() {
        return {
            'logId': this.logId,
            'prevId': this.prevLogId,
            'authorId': this.senderId,
            'chatId': this.channelId,
            'msgId': this.messageId,
            't': this.type,
            'message': this.text,
            'attachment': this.rawAttachment,
            'sendAt': this.sendTime
        };
    }
}

export interface ChatlogStructNew extends StructBase {

    logId: Long;
    prevLogId: Long;
    senderId: Long;
    channelId: Long;
    type: ChatType;
    text: string;
    sendTime: number;
    rawAttachment: string;
    messageId: number;

}

export namespace ChatlogStruct {

    let mappings = {

        logId: 'logId',
        prevLogId: 'prevId',
        senderId: 'authorId',
        channelId: 'chatId',
        type: 'type',
        text: 'message',
        sendTime: 'sendAt',
        rawAttachment: 'attachment',
        messageId: 'msgId',

    }

    let convertMap = {

        logId: JsonUtil.LongConverter,
        prevLogId: JsonUtil.LongConverter,
        senderId: JsonUtil.LongConverter,
        channelId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(mappings, convertMap);
    
}