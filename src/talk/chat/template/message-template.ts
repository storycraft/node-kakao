import { MessageType } from "../message-type";
import { ChatAttachment, SharpAttachment, EmoticonAttachment } from "../chat-attachment";
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

    set Attachment(photo) {
        this.attachment = photo;
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

//@depreacted
export abstract class EmoticonMessageTemplate implements MessageTemplate {

    constructor(
        private text: string = 'Emoticon',
        private emoticonAttachment: EmoticonAttachment
    ) {

    }

    abstract getMessageType(): MessageType

    get Text() {
        return this.text;
    }

    set Text(text) {
        this.text = text;
    }

    get EmoticonAttachment() {
        return this.emoticonAttachment;
    }

    set EmoticonAttachment(value) {
        this.emoticonAttachment = value;
    }

    get Valid() {
        return true;
    }

    getPacketText() {
        return this.text;
    }

    getPacketExtra() {
        return JSON.stringify(this.emoticonAttachment.toJsonAttachment());
    }
}

//@depreacted
export class StaticEmoticonMessageTemplate extends EmoticonMessageTemplate {

    getMessageType() {
        return MessageType.Sticker;
    }

}

//@depreacted
export class EmoticonAniMessageTemplate extends EmoticonMessageTemplate {

    getMessageType() {
        return MessageType.StickerAni;
    }

}