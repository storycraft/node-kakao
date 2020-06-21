import { KakaoAPI } from "../../../kakao-api";
import { Long } from "bson";
import { ChatType } from "../chat-type";
import { Chat } from "../chat";
import { JsonUtil } from "../../../util/json-util";
import { UserInfo } from "../../user/chat-user";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatAttachment {
    
    readAttachment(rawJson: any): void;

    toJsonAttachment(): any;

    readonly RequiredMessageType: ChatType;

}

export interface AttachmentContent {

    readRawContent(rawData: any): void;

    toRawContent(): any;

}

export interface MediaAttachment extends ChatAttachment {

    KeyPath: string;

}

export interface MediaHasThumbnail extends MediaAttachment {

    readonly HasThumbnail: boolean;

}

export class PhotoAttachment implements ChatAttachment, MediaHasThumbnail {

    constructor(
        public KeyPath: string = '',
        public Width: number = 0,
        public Height: number = 0,
        public ImageURL: string = '',
        public Size: Long = Long.ZERO,
        public MediaType: string = '',

        //NO NEED TO FILL PROPERTIES AFTER THIS COMMENT
        
        public ThumbnailURL: string = '',

        public ThumbnailWidth: number = -1,
        public ThumbnailHeight: number = -1,
        ) {
            
    }

    get RequiredMessageType() {
        return ChatType.Photo;
    }

    get HasThumbnail() {
        return true;
    }

    readAttachment(rawJson: any) {
        this.KeyPath = rawJson['k'];

        this.Width = rawJson['w'];
        this.Height = rawJson['h'];

        this.ImageURL = rawJson['url'];
        this.ThumbnailURL = rawJson['thumbnailUrl'];

        this.MediaType = rawJson['mt'];
        
        this.ThumbnailWidth = rawJson['thumbnailWidth'];
        this.ThumbnailHeight = rawJson['thumbnailHeight'];
        
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
    }

    toJsonAttachment() {
        let obj: any = {
            'url': this.ImageURL,
            'k': this.KeyPath,
            'w': this.Width,
            'h': this.Height
        };

        if (this.ThumbnailURL !== '') {
            obj['thumbnailUrl'] = this.ThumbnailURL;
        }

        if (this.MediaType !== '') {
            obj['mt'] = this.MediaType;
        }

        if (this.ThumbnailWidth !== -1) {
            obj['thumbnailWidth'] = this.ThumbnailWidth;
        }

        if (this.ThumbnailHeight !== -1) {
            obj['thumbnailHeight'] = this.ThumbnailHeight;
        }

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        return obj;
    }

    static async fromBuffer(data: Buffer, name: string, width: number, height: number, size: number = data.byteLength): Promise<PhotoAttachment> {
        let path = await KakaoAPI.uploadAttachment(KakaoAPI.AttachmentType.IMAGE, data, name);

        return new PhotoAttachment(KakaoAPI.getUploadedFileKey(path), width, height, KakaoAPI.getUploadedFile(path, KakaoAPI.AttachmentType.IMAGE), Long.fromNumber(size));
    }

}

export class VideoAttachment implements ChatAttachment, MediaHasThumbnail {

    constructor(
        public KeyPath: string = '',

        public Width: number = 0,
        public Height: number = 0,
        public Duration: number = 0,
         
        public VideoURL: string = '',
    
        public Size: Long = Long.ZERO,
        ) {
            
    }

    get RequiredMessageType() {
        return ChatType.Video;
    }

    get HasThumbnail() {
        return true;
    }

    readAttachment(rawJson: any) {
        this.KeyPath = rawJson['tk'];

        this.Width = rawJson['w'];
        this.Height = rawJson['h'];
        this.Duration = rawJson['d'];
        
        this.VideoURL = rawJson['url'];
        
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
    }

    toJsonAttachment() {
        let obj: any = {
            'url': this.VideoURL,
            'tk': this.KeyPath,
            'w': this.Width,
            'h': this.Height,
            'd': this.Duration
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        return obj;
    }

    static async fromBuffer(data: Buffer, name: string, width: number, height: number, duration: number, size: number = data.byteLength): Promise<VideoAttachment> {
        let path = await KakaoAPI.uploadAttachment(KakaoAPI.AttachmentType.VIDEO, data, name);

        return new VideoAttachment(KakaoAPI.getUploadedFileKey(path), width, height, duration, KakaoAPI.getUploadedFile(path, KakaoAPI.AttachmentType.VIDEO), Long.fromNumber(size));
    }

}

export class FileAttachment implements ChatAttachment, MediaAttachment {

    constructor(
        public KeyPath: string = '',
        public FileURL: string = '',
        public Name: string = '',
        public Size: Long = Long.ZERO,
        public Expire: Long = Long.ZERO
    ) {
        
    }

    get RequiredMessageType() {
        return ChatType.File;
    }

    readAttachment(rawJson: any): void {
        this.KeyPath = rawJson['k'];

        this.FileURL = rawJson['url'];
        this.Name = rawJson['name'];
        
        this.Size = JsonUtil.readLong(rawJson['size'] || rawJson['s']);
        this.Expire = JsonUtil.readLong(rawJson['expire']);
    }
    
    toJsonAttachment() {
        let obj: any = {
            'url': this.FileURL,
            'name': this.Name,
            'k': this.KeyPath,
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        if (this.Expire !== Long.ZERO) {
            obj['expire'] = this.Expire;
        }

        return obj;
    }

    static async fromBuffer(data: Buffer, name: string, size: number = data.byteLength, expire: Long = Long.fromNumber(1209600)): Promise<FileAttachment> {
        let path = await KakaoAPI.uploadAttachment(KakaoAPI.AttachmentType.FILE, data, name);

        return new FileAttachment(KakaoAPI.getUploadedFileKey(path), KakaoAPI.getUploadedFile(path, KakaoAPI.AttachmentType.FILE), name, Long.fromNumber(size), expire);
    }

}

export class AudioAttachment implements ChatAttachment, MediaAttachment {

    constructor(
        public KeyPath: string = '',
        public AudioURL: string = '',
        public Size: Long = Long.ZERO
    ) {
        
    }

    get RequiredMessageType() {
        return ChatType.Audio;
    }

    readAttachment(rawJson: any): void {
        this.KeyPath = rawJson['tk'];

        this.AudioURL = rawJson['url'];
        
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
    }
    
    toJsonAttachment() {
        let obj: any = {
            'url': this.AudioURL,
            'tk': this.KeyPath,
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        return obj;
    }

    static async fromBuffer(data: Buffer, name: string, size: number = data.byteLength): Promise<AudioAttachment> {
        let path = await KakaoAPI.uploadAttachment(KakaoAPI.AttachmentType.AUDIO, data, name);

        return new AudioAttachment(KakaoAPI.getUploadedFileKey(path), KakaoAPI.getUploadedFile(path, KakaoAPI.AttachmentType.AUDIO), Long.fromNumber(size));
    }

}

export class EmoticonAttachment implements ChatAttachment {

    constructor(
        public Name: string = '',
        public Path: string = '',
        public Type: string = '',
        public StopAt: number = 0,
        public Sound: string = '',
        public Width: number = -1,
        public Height: number = -1,
        public Description: string = '',
    ) {
        
    }

    get RequiredMessageType(): ChatType {
        return ChatType.Sticker;
    }

    getEmoticonURL(region: string = 'kr') {
        return KakaoAPI.getEmoticonImageURL(this.Path, region);
    }

    readAttachment(rawJson: any) {
        this.Path = rawJson['path'];
        this.Name = rawJson['name'];
        this.Type = rawJson['type'];
        this.Description = rawJson['alt'];
        this.StopAt = rawJson['s'];

        this.Sound = rawJson['sound'];

        this.Width = rawJson['width'] || -1;
        this.Height = rawJson['height'] || -1;
    }

    toJsonAttachment() {
        let obj: any = {
            'path': this.Path,
            'name': this.Name,
            'type': this.Type,
            's': this.StopAt
        };

        if (this.Description !== '') {
            obj['alt'] = this.Description;
        }

        if (this.Sound !== '') {
            obj['sound'] = this.Sound;
        }

        if (this.Width !== -1) {
            obj['width'] = this.Width;
        }

        if (this.Height !== -1) {
            obj['height'] = this.Height;
        }

        return obj;
    }

}

export class EmoticonAniAttachment extends EmoticonAttachment {

    get RequiredMessageType(): ChatType {
        return ChatType.StickerAni;
    }

}

export class LongTextAttachment implements ChatAttachment, MediaAttachment {

    constructor(
        public Path: string = '',
        public KeyPath: string = '',
        public Size: Long = Long.ZERO,
        public TextOmitted: boolean = false
    ) {
        
    }

    get RequiredMessageType() {
        return ChatType.Text;
    }

    readAttachment(rawJson: any) {
        this.Path = rawJson['path'];
        this.KeyPath = rawJson['k'];
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
        this.TextOmitted = rawJson['sd'];
    }

    toJsonAttachment() {
        let obj: any = {
            'path': this.Path,
            'k': this.KeyPath
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        if (this.TextOmitted) {
            obj['sd'] = this.TextOmitted;
        }

        return obj;
    }

    static async fromText(longText: string, name: string, size?: number): Promise<LongTextAttachment> {
        let buffer = Buffer.from(longText);
        return LongTextAttachment.fromBuffer(buffer, name, size ? size : buffer.byteLength);
    }

    static async fromBuffer(data: Buffer, name: string, size: number = data.byteLength): Promise<LongTextAttachment> {
        let path = await KakaoAPI.uploadAttachment(KakaoAPI.AttachmentType.FILE, data, name);

        return new LongTextAttachment(path, KakaoAPI.getUploadedFileKey(path), Long.fromNumber(size), true);
    }

}

export class MapAttachment implements ChatAttachment {

    constructor(
        public Lat: number = 0,
        public Lng: number = 0,
        public Address: string = '',
        public IsCurrent: boolean = false
    ) {

    }

    get RequiredMessageType() {
        return ChatType.Map;
    }

    readAttachment(rawData: any): void {
        this.Lat = rawData['lat'];
        this.Lng = rawData['lng'];
        this.Address = rawData['a'];

        this.IsCurrent = rawData['c'];
    }

    toJsonAttachment() {
        return {
            'lat': this.Lat,
            'lng': this.Lng,
            'a': this.Address,
            'c': this.IsCurrent
        };
    }

}

export class MentionContentList implements AttachmentContent {
    
    constructor(
        public UserId: Long = Long.ZERO,
        public Length: number = 0,
        public IndexList: number[] = []
    ) {
        
    }

    readRawContent(rawData: any): void {
        this.IndexList = rawData['at'] || [];
        this.UserId = JsonUtil.readLong(rawData['user_id']);
        this.Length = rawData['len'];
    }

    toRawContent() {
        let obj: any = {
            'at': this.IndexList,
            'len': this.Length,
            'user_id': this.UserId
        };

        return obj;
    }

}

export interface ChatContent {

    readonly ContentType: string;

}

export class ChatMention implements ChatContent {
    
    constructor(
        public Info: UserInfo
    ) {
        
    }

    get ContentType() {
        return 'mention';
    }

}

export class ReplyAttachment implements ChatAttachment {

    constructor(
        public SourceType: ChatType = ChatType.Text,
        public SourceLogId: Long = Long.ZERO,
        public SourceUserId: Long = Long.ZERO,
        public AttachOnly: boolean = false,
        public SourceMessage: string = '',
        public SourceMentionList: MentionContentList[] = [],
        public SourceLinkId: Long = Long.ZERO // ONLY ON OPENPROFILE ?!

    ) {

    }

    get RequiredMessageType() {
        return ChatType.Reply;
    }

    readAttachment(rawData: any) {
        this.SourceLogId = JsonUtil.readLong(rawData['src_logId']);

        let rawMentionList = rawData['src_mentions'] || [];

        this.SourceMentionList = [];
        for (let rawMention of rawMentionList) {
            let content = new MentionContentList();

            content.readRawContent(rawMention);

            this.SourceMentionList.push(content);
        }

        this.SourceMessage = rawData['src_message'];
        this.SourceType = rawData['src_type'];
        this.SourceUserId = JsonUtil.readLong(rawData['src_userId']);

        if (rawData['attach_only']) this.AttachOnly = rawData['attach_only'];

        if (rawData['src_linkId']) {
            this.SourceLinkId = JsonUtil.readLong(rawData['src_linkId']);
        }
    }

    toJsonAttachment(): any {
        let obj: any = {
            'src_logId': this.SourceLogId,
            'src_mentions': this.SourceMentionList,
            'src_message': this.SourceMessage,
            'src_type': this.SourceType,
            'src_userId': this.SourceUserId
        };

        if (this.SourceLinkId !== Long.ZERO) {
            obj['src_linkId'] = this.SourceLinkId;
        }

        if (this.AttachOnly) obj['attach_only'] = this.AttachOnly;

        return obj;
    }

    static fromChat(chat: Chat, hideText: boolean = false): ReplyAttachment {
        return new ReplyAttachment(chat.Type, chat.LogId, chat.Sender.Id, hideText, chat.Text, chat.getMentionContentList());
    }
}
