/*
 * Created on Thu Apr 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { MessageType } from "../message-type";
import { ChatAttachment } from "./chat-attachment";
import { AttachmentContent } from "./chat-attachment";

export class KakaoLinkV2Content implements AttachmentContent {

    readRawContent(rawData: any): void {
        
    }

    toRawContent(): any {
        let obj = {
            
        };


    }

}

export class KakaoLinkV2Attachment implements ChatAttachment {

    constructor(

    ) {

    }

    readAttachment(rawJson: any): void {
        
    }

    toJsonAttachment() {
        
    }

    get RequiredMessageType() {
        return MessageType.KakaoLinkV2;
    }

}