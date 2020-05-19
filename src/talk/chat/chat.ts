import { ChatType } from "./chat-type";
import { Long, EJSON } from "bson";
import { ChatChannel, OpenChatChannel } from "../channel/chat-channel";
import { ChatUser } from "../user/chat-user";
import { ChatAttachment, PhotoAttachment, MessageTemplate } from "../..";
import { EmoticonAttachment, LongTextAttachment, VideoAttachment, MentionContentList, ChatMention, MapAttachment, ReplyAttachment} from "./attachment/chat-attachment";
import { SharpAttachment } from "./attachment/sharp-attachment";
import { JsonUtil } from "../../util/json-util";
import { ChatFeed } from "./chat-feed";
import { CustomAttachment } from "./attachment/custom-attachment";
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

    abstract get Type(): ChatType;

    isFeed(): boolean {
        return this.Type === ChatType.Feed;
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

export class UnknownChat extends Chat {

    private rawAttachment: any = {};
    
    get Type() {
        return ChatType.Unknown;
    }

    get RawAttachment() {
        return this.rawAttachment;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        this.rawAttachment = attachmentJson;
    }

}

export class FeedChat extends Chat {
    
    get Type() {
        return ChatType.Feed;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        
    }

}

export class TextChat extends Chat {
    
    get Type() {
        return ChatType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        if (attachmentJson['path'] && attachmentJson['k'] && attachmentJson['s'] && attachmentJson['cs']) { // :(
            attachmentList.push(new LongTextAttachment(attachmentJson['path'], attachmentJson['k'], attachmentJson['s']));
        }
    }

}

export abstract class PhotoChat extends Chat {

    get AttachmentList(): PhotoAttachment[] {
        return super.AttachmentList as PhotoAttachment[];
    }

}

export class SinglePhotoChat extends PhotoChat {

    get Type() {
        return ChatType.Photo;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let photoAttachment = new PhotoAttachment();

        photoAttachment.readAttachment(attachmentJson);

        attachmentList.push(photoAttachment);
    }

}

export class MultiPhotoChat extends PhotoChat {

    get Type() {
        return ChatType.MultiPhoto;
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
        return ChatType.Sticker;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new EmoticonAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}

export class AnimatedEmoticonChat extends EmoticonChat {
    
    get Type() {
        return ChatType.StickerAni;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new EmoticonAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}

export class VideoChat extends Chat {
    
    get Type() {
        return ChatType.Video;
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
        return ChatType.Text;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let textAttachment = new LongTextAttachment();
        textAttachment.readAttachment(attachmentJson);

        attachmentList.push(textAttachment);
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return ChatType.Search;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let sharpAttachment = new SharpAttachment();

        sharpAttachment.readAttachment(attachmentJson);

        attachmentList.push(sharpAttachment);
    }

}

export class MapChat extends Chat {

    get Type() {
        return ChatType.Map;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let mapAttachment = new MapAttachment();

        mapAttachment.readAttachment(attachmentJson);

        attachmentList.push(mapAttachment);
    }

}

export class ReplyChat extends Chat {
    
    get Type() {
        return ChatType.Reply;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let replyAttachment = new ReplyAttachment();

        replyAttachment.readAttachment(attachmentJson);

        attachmentList.push(replyAttachment);
    }

}

export class CustomChat extends Chat {
    
    get Type() {
        return ChatType.Custom;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let customAttachment = new CustomAttachment();

        customAttachment.readAttachment(attachmentJson);

        attachmentList.push(customAttachment);
    }

}
