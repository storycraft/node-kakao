import { MessageType } from "../message-type";
import { PhotoAttachment } from "../chat-attachment";

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

export class PhotoTemplate implements MessageTemplate {

    constructor(
        private photo: PhotoAttachment,
        private text: string = 'Photo'
    ) {

    }

    get Attachment() {
        return this.photo;
    }

    set Attachment(photo) {
        this.photo = photo;
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
        return MessageType.Photo;
    }

    getPacketText() {
        return this.text;
    }

    getPacketExtra() {
        return JSON.stringify(this.photo.toJsonAttachment());
    }

}