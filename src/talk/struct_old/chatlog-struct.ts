import { StructBase } from "./struct-base";
import { ChatType } from "../chat_old/chat-type";
import { Long } from "bson";
import { ObjectMapper } from "json-proxy-mapper";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum ChatRefererType {

    UNKNOWN = 0,
    KAKAOI = 1,
    BOT = 2

}

export interface ChatlogStruct extends StructBase {

    logId: Long;
    prevLogId: Long;
    senderId: Long;
    channelId: Long;
    type: ChatType;
    text: string;
    sendTime: number;
    referer?: ChatRefererType;
    rawAttachment?: string;
    supplement?: string;
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
        referer: 'referer',
        supplement: 'supplement'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}