import { MessageType } from "./message-type";
import { Long } from "bson";
import { ChatChannel } from "../room/chat-channel";
import { ChatUser } from "../user/chat-user";
import { ChatlogStruct } from "../struct/chatlog-struct";

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

    private attachmentList: ChatAttachment[];

    private sendTime: number;

    constructor(channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number, rawAttachment: string = '{}') {
        this.channel = channel;
        this.sender = sender;

        this.logId = logId;
        this.prevLogId = prevLogId;

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
    
}

export class ChatAttachment {
    
    readAttachment(rawJson: any) {

    }

}

export class PhotoAttachment extends ChatAttachment {
    
    private keyPath: string;

    private width: number;
    private height: number;

    private imageURL: string;
    private thumbnailURL: string;

    private thumbnailWidth: number;
    private thumbnailHeight: number;

    private size: number;

    constructor() {
        super();

        this.keyPath = '';

        this.width = 0;
        this.height = 0;

        this.imageURL = '';
        this.thumbnailURL = '';

        this.thumbnailWidth = 0;
        this.thumbnailHeight = 0;
        
        this.size = 0;
    }

    get KeyPath() {
        return this.keyPath;
    }

    get Width() {
        return this.width;
    }

    get Height() {
        return this.height;
    }

    get ImageURL() {
        return this.imageURL;
    }

    get ThumbnailWidth() {
        return this.thumbnailWidth;
    }

    get ThumbnailHeight() {
        return this.thumbnailHeight;
    }

    get ThumbnailURL() {
        return this.thumbnailURL;
    }

    get Size() {
        return this.size;
    }

    readAttachment(rawJson: any) {
        this.keyPath = rawJson['k'];

        this.width = rawJson['w'];
        this.height = rawJson['h'];

        this.imageURL = rawJson['url'];
        this.thumbnailURL = rawJson['thumbnailUrl'];
        
        this.thumbnailWidth = rawJson['thumbnailWidth'];
        this.thumbnailHeight = rawJson['thumbnailHeight'];
        
        this.size = rawJson['s'];
    }

}

export class TextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}

export class PhotoChat extends Chat {

    get Type() {
        return MessageType.Photo;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let photoAttachment = new PhotoAttachment();

        photoAttachment.readAttachment(attachmentJson);

        attachmentList.push(photoAttachment);
    }

}

export class VideoChat extends Chat {
    
    get Type() {
        return MessageType.Video;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {

    }

}

export class LongTextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}

export class EmoticonChat extends Chat {
    
    get Type() {
        return MessageType.DitemEmoticon;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return MessageType.Search;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}