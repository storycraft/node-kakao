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

export interface ChatlogStruct extends StructBase {

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

    export const Mappings = {

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

    export const MAPPER = new ObjectMapper(Mappings);
    
}