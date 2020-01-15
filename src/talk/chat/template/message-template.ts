import { MessageType } from "../message-type";
import { PhotoAttachment, ChatAttachment, VideoAttachment, AudioAttachment } from "../chat-attachment";

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