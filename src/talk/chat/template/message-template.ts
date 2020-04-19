import { MessageType } from "../message-type";
import { PhotoAttachment, ChatAttachment, VideoAttachment, AudioAttachment, SharpAttachment, EmoticonAttachment } from "../chat-attachment";

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
        private text: string = 'Attachment'
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
        if (this.attachment) {
            if (this.attachment instanceof PhotoAttachment) {
                return MessageType.Photo;
            } else if (this.attachment instanceof VideoAttachment) {
                return MessageType.Video;
            } else if (this.attachment instanceof AudioAttachment) {
                return MessageType.Audio;
            }
        }

        return MessageType.File;
    }

    getPacketText() {
        return this.text;
    }

    getPacketExtra() {
        return JSON.stringify(this.attachment.toJsonAttachment());
    }

}

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

export class StaticEmoticonMessageTemplate extends EmoticonMessageTemplate {

    getMessageType() {
        return MessageType.Sticker;
    }

}

export class EmoticonAniMessageTemplate extends EmoticonMessageTemplate {

    getMessageType() {
        return MessageType.StickerAni;
    }

}