import { MessageType } from "./message-type";
import { Long, EJSON } from "bson";
import { ChatChannel, OpenChatChannel } from "../channel/chat-channel";
import { ChatUser } from "../user/chat-user";
import { ChatAttachment, PhotoAttachment, MessageTemplate } from "../..";
import { EmoticonAttachment, LongTextAttachment, VideoAttachment, SharpAttachment, MentionContentList, ChatMention } from "./attachment/chat-attachment";
import { PacketDeleteChatReq, PacketDeleteChatRes } from "../../packet/packet-delete-chat";
import { JsonUtil } from "../../util/json-util";
import { ChatFeed } from "./chat-feed";
import { KakaoLinkV2Attachment } from "./attachment/kakaolink-attachment";
import { StatusCode } from "../../packet/loco-packet-base";
import { ChannelType } from "./channel-type";

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
    private mentionMap: Map<string, MentionContentList>;

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
        this.mentionMap = new Map();
        this.processAttachment(text, rawAttachment);
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

    get MentionMap() {
        return this.mentionMap;
    }

    getMentionContentList() {
        return Array.from(this.mentionMap.values());
    }

    isMentioned(userId: Long): boolean {
        return this.mentionMap.has(userId.toString());
    }

    getUserMentionList(userId: Long): MentionContentList | null {
        if (!this.isMentioned(userId)) return null;

        return this.mentionMap.get(userId.toString())!;
    }

    getMentionCount(userId: Long): number {
        let mentionList = this.getUserMentionList(userId);

        if (!mentionList) return 0;
        
        return this.getUserMentionList(userId)!.IndexList.length;
    }

    abstract get Type(): MessageType;

    isFeed(): boolean {
        return this.Type === MessageType.Feed;
    }
    
    private feed?: ChatFeed;

    getFeed() {
        if (!this.isFeed()) {
            throw new Error(`Message ${this.logId.toString()} is not Feed`);
        }

        if (this.feed) return this.feed;

        return this.feed = ChatFeed.getFeedFromText(this.text);
    }

    protected processAttachment(text: string, rawAttachment: string) { // adds text for old types
        if (!rawAttachment || rawAttachment === '') {
            return;
        }

        let json: any = {};

        try {
            json = JsonUtil.parseLoseless(rawAttachment);
        } catch(e) {
            
        }

        this.readAttachment(json, this.attachmentList);

        if (json['mentions']) this.processMention(json['mentions']);
    }

    protected abstract readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]): void;

    protected processMention(rawMentions: any[]) {
        this.mentionMap.clear();

        for (let rawMention of rawMentions) {
            let content = new MentionContentList();

            content.readRawContent(rawMention);

            this.mentionMap.set(content.UserId.toString(), content);
        }
    }

    async replyText(...textFormat: (string | ChatMention)[]) {
        return this.Channel.sendText(...textFormat);
    }

    async replyTemplate(template: MessageTemplate) {
        return this.Channel.sendTemplate(template);
    }

    get Deletable(): boolean {
        return this.Sender.isClientUser();
    }

    get Hidable(): boolean {
        return this.channel.isOpenChat() && this.channel.Type === ChannelType.OPENCHAT_GROUP;
    }

    async delete(): Promise<boolean> {
        if (!this.Deletable) {
            return false;
        }

        return this.channel.Client.ChatManager.deleteChat(this.Channel.Id, this.logId);
    }

    async hide(): Promise<boolean> {
        if (!this.Hidable) {
            return false;
        }

        let openChannel = this.channel as OpenChatChannel;

        return openChannel.hideChat(this);
    }
    
}

export class FeedChat extends Chat {
    
    get Type() {
        return MessageType.Feed;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
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
        textAttachment.readAttachment(attachmentJson);

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

export class ReplyChat extends Chat {
    
    get Type() {
        return MessageType.Reply;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let sharpAttachment = new SharpAttachment();

        sharpAttachment.readAttachment(attachmentJson);

        attachmentList.push(sharpAttachment);
    }

}

export class KakaoLinkV2Chat extends Chat {
    
    get Type() {
        return MessageType.KakaoLinkV2;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let linkAttachment = new KakaoLinkV2Attachment();

        linkAttachment.readAttachment(attachmentJson);

        attachmentList.push(linkAttachment);
    }

}