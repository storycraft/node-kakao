/*
 * Created on Thu Apr 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { MessageType } from "../message-type";
import { ChatAttachment } from "./chat-attachment";
import { AttachmentContent } from "./chat-attachment";

export enum CustomType {

    FEED = 'Feed',
    LIST = 'List',
    COMMERCE = 'Commerce',
    CAROUSEL = 'Carousel'

}

export enum CustomButtonType {

    HORIZONTAL = 0,
    VERTICAL = 1

}

export abstract class CustomBaseContent implements AttachmentContent {

    abstract readRawContent(rawData: any): void;

    abstract toRawContent(): any;

}

export abstract class CustomContent extends CustomBaseContent {

}

export class CustomFragment implements CustomBaseContent {

    readRawContent(rawData: any): void {
        
    }

    toRawContent() {
        
    }

}

export class CustomProfile implements CustomBaseContent {

    constructor() {

    }

    readRawContent(rawData: any): void {
        
    }

    toRawContent() {
        
    }

}

export class CustomAttachment implements ChatAttachment {

    constructor(
        public Profile: CustomProfile = new CustomProfile()
    ) {

    }

    readAttachment(rawJson: any): void {
        
    }

    toJsonAttachment() {
        
    }

    get RequiredMessageType() {
        return MessageType.Custom;
    }

}