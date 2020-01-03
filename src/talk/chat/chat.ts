import { MessageType } from "./message-type";
import { Long } from "bson";
import { ChatChannel } from "../room/chat-channel";
import { ChatUser } from "../user/chat-user";
import { ChatlogStruct } from "../struct/chatlog-struct";
import { ChatAttachment, PhotoAttachment, MessageTemplate } from "../..";
import { EmoticonAttachment, LongTextAttachment, VideoAttachment, SharpAttachment } from "./chat-attachment";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class Chat {

    private prevLogId: Long;
    private logId: Long;

    private channel: ChatChannel;
    private sender: ChatUser;

    private messageId: number;

    private text: string;

    private attachmentList: ChatAttachment[];

    private sendTime: number;

    constructor(channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number, text: string, rawAttachment: string = '{}') {
        this.channel = channel;
        this.sender = sender;

        this.logId = logId;
        this.prevLogId = prevLogId;

        this.text = text;

        this.messageId = messageId;
        this.sendTime = sendTime;

        this.attachmentList = [];
        this.processAttachment(rawAttachment);
    }

    get Channel() {
        return this.channel;
    }

    get Sender() {
        return this.sender;
    }

    get PrevLogId() {
        return this.prevLogId;
    }

    get LogId() {
        return this.logId;
    }

    get MessageId() {
        return this.messageId;
    }

    get Text() {
        return this.text;
    }
    
    get SendTime() {
        return this.sendTime;
    }

    get AttachmentList() {
        return this.attachmentList;
    }

    abstract get Type(): MessageType;

    protected processAttachment(rawAttachment: string) {
        if (!rawAttachment || rawAttachment === '') {
            return;
        }

        let json: any = {};

        try {
            json = JSON.parse(rawAttachment);
        } catch(e) {
            
        }

        this.readAttachment(json, this.attachmentList);
    }

    protected abstract readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]): void;

    async replyText(text: string) {
        return this.Channel.sendText(text);
    }

    async replyTemplate(template: MessageTemplate) {
        return this.Channel.sendTemplate(template);
    }
    
}

export class TextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}

export abstract class PhotoChat extends Chat {

    get AttachmentList(): PhotoAttachment[] {
        return super.AttachmentList as PhotoAttachment[];
    }

}

export class SinglePhotoChat extends PhotoChat {

    get Type() {
        return MessageType.Photo;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let photoAttachment = new PhotoAttachment();

        photoAttachment.readAttachment(attachmentJson);

        attachmentList.push(photoAttachment);
    }

}

export class MultiPhotoChat extends PhotoChat {

    get Type() {
        return MessageType.MultiPhoto;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let keyPathList: string[] = attachmentJson['kl'];

        for (let i = 0; i < keyPathList.length; i++) {
            let photoAttachment = new PhotoAttachment(
                attachmentJson['kl'][i],
                attachmentJson['wl'][i],
                attachmentJson['hl'][i],
                attachmentJson['imageUrls'][i],
                attachmentJson['thumbnailUrls'][i],
                attachmentJson['thumbnailWidths'][i],
                attachmentJson['thumbnailHeights'][i],
                attachmentJson['sl'][i]
            );

            attachmentList.push(photoAttachment);
        }
    }

}

export abstract class EmoticonChat extends Chat {

}

export class StaticEmoticonChat extends EmoticonChat {
    
    get Type() {
        return MessageType.Sticker;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new EmoticonAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}

export class AnimatedEmoticonChat extends EmoticonChat {
    
    get Type() {
        return MessageType.StickerAni;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new EmoticonAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}

export class VideoChat extends Chat {
    
    get Type() {
        return MessageType.Video;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new VideoAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}


//Unused
export class LongTextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let textAttachment = new LongTextAttachment();
        textAttachment.readAttachment(LongTextAttachment);

        attachmentList.push(textAttachment);
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return MessageType.Search;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let sharpAttachment = new SharpAttachment();

        sharpAttachment.readAttachment(attachmentJson);

        attachmentList.push(sharpAttachment);
    }

}