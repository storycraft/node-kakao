import { ChatType } from "./chat-type";
import { Long, EJSON } from "bson";
import { ChatChannel, OpenChatChannel } from "../channel_old/chat-channel";
import { ChatUser } from "../user_old/chat-user";
import { ChatAttachment, PhotoAttachment, MessageTemplate, MediaTemplates } from "../..";
import { EmoticonAttachment, LongTextAttachment, VideoAttachment, MentionContentList, ChatMention, MapAttachment, ReplyAttachment } from "./attachment/chat-attachment";
import { SharpAttachment } from "./attachment/sharp-attachment";
import { JsonUtil } from "../../util/json-util";
import { ChatFeed } from "./chat-feed";
import { CustomAttachment } from "./attachment/custom-attachment";
import { ChannelType } from "../channel_old/channel-type";
import { FeedType } from "../feed/feed-type";
import { RichFeedAttachment } from "./attachment/rich-feed-attachment";
import { RequestResult } from "../../request/request-result";

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

    private rawAttachment: any = {};

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

    get RawAttachment() {
        return this.rawAttachment;
    }

    get MentionMap() {
        return this.mentionMap;
    }

    async markChatRead() {
        await this.channel.markChannelRead(this.logId);
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

        this.rawAttachment = json;
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

    async replyMedia(template: MediaTemplates) {
        return this.Channel.sendMedia(template);
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

    async delete(): Promise<RequestResult<boolean>> {
        return this.channel.Client.ChatManager.deleteChat(this.Channel.Id, this.logId);
    }

    async hide(): Promise<RequestResult<boolean>> {
        let openChannel = this.channel as OpenChatChannel;

        return openChannel.hideChat(this);
    }
    
}

export class UnknownChat extends Chat {
    
    get Type() {
        return ChatType.Unknown;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]): void {
        
    }

}

export class FeedChat<T extends ChatFeed = ChatFeed> extends Chat {
    
    get Type() {
        return ChatType.Feed;
    }

    get Feed(): T {
        return this.getFeed() as T;
    }

    get RichFeedAttachment(): RichFeedAttachment | null {
        return this.AttachmentList[0] as RichFeedAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        try {
            if (this.getFeed().feedType === FeedType.RICH_CONTENT) {
                attachmentList.push(new RichFeedAttachment(attachmentJson['text'], attachmentJson['icon'], attachmentJson['action']));
            }
        } catch (e) {
            // SKIP if invalid
        }
    }

}

export class TextChat extends Chat {
    
    get Type() {
        return ChatType.Text;
    }

    get LongText(): LongTextAttachment | null {
        return this.AttachmentList[0] as LongTextAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        if (attachmentJson['path'] && attachmentJson['k'] && attachmentJson['s']) { // :(
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

    get Photo(): PhotoAttachment | null {
        return this.AttachmentList[0] as PhotoAttachment || null;
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
                attachmentJson['sl'][i],
                attachmentJson['mtl'][i],
                attachmentJson['thumbnailUrls'][i],
                attachmentJson['thumbnailWidths'][i],
                attachmentJson['thumbnailHeights'][i]
            );

            attachmentList.push(photoAttachment);
        }
    }

}

export abstract class EmoticonChat extends Chat {

    get Emoticon(): EmoticonAttachment | null {
        return this.AttachmentList[0] as EmoticonAttachment || null;
    }

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

export class GifEmoticonChat extends EmoticonChat {
    
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

    get Video(): VideoAttachment | null {
        return this.AttachmentList[0] as VideoAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let attachment = new VideoAttachment();
        attachment.readAttachment(attachmentJson);

        attachmentList.push(attachment);
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return ChatType.Search;
    }

    get Sharp(): SharpAttachment | null {
        return this.AttachmentList[0] as SharpAttachment || null;
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

    get Map(): MapAttachment | null {
        return this.AttachmentList[0] as MapAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let mapAttachment = new MapAttachment();

        mapAttachment.readAttachment(attachmentJson);

        attachmentList.push(mapAttachment);
    }

}

export class ReplyChat extends Chat {

    private contentOnly: boolean = false;
    
    get Type() {
        return ChatType.Reply;
    }

    get ShowContentOnly() {
        return this.contentOnly;
    }

    get Reply(): ReplyAttachment | null {
        return this.AttachmentList[0] as ReplyAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let replyAttachment = new ReplyAttachment();

        replyAttachment.readAttachment(attachmentJson);

        attachmentList.push(replyAttachment);

        if (attachmentJson['attach_type']) {
            let contentChat = new (TypeMap.getChatConstructor(attachmentJson['attach_type']))(this.Channel, this.Sender, this.MessageId, this.LogId, this.PrevLogId, this.SendTime, this.Text, attachmentJson['attach_content']);
            attachmentList.push(...contentChat.AttachmentList);
        }

        if (attachmentJson['attach_only']) this.contentOnly = true;
    }

}

export class CustomChat extends Chat {
    
    get Type() {
        return ChatType.Custom;
    }

    get Custom(): CustomAttachment | null {
        return this.AttachmentList[0] as CustomAttachment || null;
    }

    protected readAttachment(attachmentJson: any, attachmentList: ChatAttachment[]) {
        let customAttachment = new CustomAttachment();

        customAttachment.readAttachment(attachmentJson);

        attachmentList.push(customAttachment);
    }

}

export namespace TypeMap {

    export type ChatConstructor = new (channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number, text: string, rawAttachment: string | undefined) => Chat;

    let typeMap: Map<ChatType, ChatConstructor> = new Map();

    let defaultConstructor: ChatConstructor = UnknownChat;

    export function getDefaultConstructor() {
        return defaultConstructor;
    }

    export function getChatConstructor(type: ChatType): ChatConstructor {
        return typeMap.get(type) || defaultConstructor;
    }

    typeMap.set(ChatType.Feed, FeedChat);
    typeMap.set(ChatType.Text, TextChat);
    typeMap.set(ChatType.Photo, SinglePhotoChat);
    typeMap.set(ChatType.MultiPhoto, MultiPhotoChat);
    typeMap.set(ChatType.Video, VideoChat);
    typeMap.set(ChatType.Sticker, StaticEmoticonChat);
    typeMap.set(ChatType.StickerAni, AnimatedEmoticonChat);
    typeMap.set(ChatType.StickerGif, GifEmoticonChat);
    typeMap.set(ChatType.Search, SharpSearchChat);
    typeMap.set(ChatType.Map, MapChat);
    typeMap.set(ChatType.Reply, ReplyChat);
    typeMap.set(ChatType.Custom, CustomChat);

    
}
