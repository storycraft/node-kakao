import { MessageType } from "../message-type";
import { ChatAttachment, SharpAttachment, EmoticonAttachment } from "../attachment/chat-attachment";
import { JsonUtil } from "../../../util/json-util";

/*
 * Created on Fri Jan 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MessageTemplate {

    readonly Valid: boolean;

    getMessageType(): MessageType;

    getPacketText(): string;
    getPacketExtra(): string;

}

export class AttachmentTemplate implements MessageTemplate {

    constructor(
        private attachment: ChatAttachment,
        private text: string = '' //required for some attachment
    ) {

    }

    get Attachment() {
        return this.attachment;
    }

    set Attachment(attachment) {
        this.attachment = attachment;
    }

    get Text() {
        return this.text;
    }

    set Text(text) {
        this.text = text;
    }

    get Valid() {
        return true;
    }

    getMessageType() {
        return this.attachment.RequiredMessageType;
    }

    getPacketText() {
        return this.text;
    }

    getPacketExtra() {
        return JsonUtil.stringifyLoseless(this.attachment.toJsonAttachment());
    }

}

//@depreacted
export class SharpMessageTemplate implements MessageTemplate {

    constructor(
        private text: string = 'Search message',
        private sharpAttachment: SharpAttachment
    ) {

    }

    getMessageType() {
        return MessageType.Search;
    }

    get Text() {
        return this.text;
    }

    set Text(text) {
        this.text = text;
    }

    get SharpAttachment() {
        return this.sharpAttachment;
    }

    set SharpAttachment(value) {
        this.sharpAttachment = value;
    }

    get Valid() {
        return true;
    }

    getPacketText() {
        return this.text;
    }

    getPacketExtra() {
        return JSON.stringify(this.sharpAttachment.toJsonAttachment());
    }

}