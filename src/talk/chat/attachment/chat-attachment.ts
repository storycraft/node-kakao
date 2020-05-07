import { KakaoAPI } from "../../../kakao-api";
import { Long } from "bson";
import { MessageType } from "../message-type";
import { Chat } from "../chat";
import { JsonUtil } from "../../../util/json-util";
import { ChatUser } from "../../user/chat-user";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatAttachment {
    
    readAttachment(rawJson: any): void;

    toJsonAttachment(): any;

    readonly RequiredMessageType: MessageType;

}

export interface AttachmentContent {

    readRawContent(rawData: any): void;

    toRawContent(): any;

}

export class PhotoAttachment implements ChatAttachment {

    constructor(
        public KeyPath: string = '',
        public Width: number = 0,
        public Height: number = 0,
        public ImageURL: string = '',
        public Size: Long = Long.ZERO,

        //NO NEED TO FILL PROPERTIES AFTER THIS COMMENT
        
        public ThumbnailURL: string = '',

        public ThumbnailWidth: number = -1,
        public ThumbnailHeight: number = -1,
        ) {
            
    }

    get RequiredMessageType() {
        return MessageType.Photo;
    }

    readAttachment(rawJson: any) {
        this.KeyPath = rawJson['k'];

        this.Width = rawJson['w'];
        this.Height = rawJson['h'];

        this.ImageURL = rawJson['url'];
        this.ThumbnailURL = rawJson['thumbnailUrl'];
        
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

}

export class VideoAttachment implements ChatAttachment {

    constructor(
        public KeyPath: string = '',

        public Width: number = 0,
        public Height: number = 0,
    
        public VideoURL: string = '',
    
        public Size: Long = Long.ZERO,
        ) {
            
    }

    get RequiredMessageType() {
        return MessageType.Video;
    }

    readAttachment(rawJson: any) {
        this.KeyPath = rawJson['tk'];

        this.Width = rawJson['w'];
        this.Height = rawJson['h'];

        this.VideoURL = rawJson['url'];
        
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
    }

    toJsonAttachment() {
        let obj: any = {
            'url': this.VideoURL,
            'tk': this.KeyPath,
            'w': this.Width,
            'h': this.Height
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        return obj;
    }

}

export class FileAttachment implements ChatAttachment {

    constructor(
        public KeyPath: string = '',
        public FileURL: string = '',
        public Name: string = '',
        public Size: Long = Long.ZERO,
        public Expire: Long = Long.ZERO
    ) {
        
    }

    get RequiredMessageType() {
        return MessageType.File;
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

}

export class AudioAttachment implements ChatAttachment {

    constructor(
        public KeyPath: string = '',
        public AudioURL: string = '',
        public Size: Long = Long.ZERO
    ) {
        
    }

    get RequiredMessageType() {
        return MessageType.Audio;
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

    get RequiredMessageType(): MessageType {
        return MessageType.Sticker;
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

    get RequiredMessageType(): MessageType {
        return MessageType.StickerAni;
    }

}


//unused
export class LongTextAttachment implements ChatAttachment {

    constructor(
        public Path: string = '',
        public KeyPath: string = '',
        public Size: Long = Long.ZERO,
        public SD: boolean = false//whats this
    ) {
        
    }

    get RequiredMessageType() {
        return MessageType.Template;
    }

    readAttachment(rawJson: any) {
        this.Path = rawJson['path'];
        this.KeyPath = rawJson['k'];
        this.Size = JsonUtil.readLong(rawJson['s'] || rawJson['size']);
        this.SD = rawJson['sd'];
    }

    toJsonAttachment() {
        let obj: any = {
            'path': this.Path,
            'k': this.KeyPath
        };

        if (this.Size !== Long.ZERO) {
            obj['s'] = obj['size'] = this.Size;
        }

        if (this.SD) {
            obj['sd'] = this.SD;
        }

        return obj;
    }

}

export enum SharpContentType {

    NONE = '',
    LIST = 'list',
    IMAGE = 'image',
    VIDEO_CLIP = 'vclip',
    WEATHER = 'weather',
    MOVIE = 'movie'

}

export abstract class SharpContent implements AttachmentContent {
    
    abstract readRawContent(rawData: any): void;
    
    abstract toRawContent(): any;

}

export abstract class SharpFragment extends SharpContent {

}

export class SharpImageFragment extends SharpFragment {

    constructor(
        public ImageURL: string = '',
        public ImageWidth: number = -1,
        public ImageHeight: number = -1
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.ImageURL = rawData['I'] || '';
        this.ImageWidth = rawData['W'] || -1;
        this.ImageHeight = rawData['H'] || -1;
    }

    toRawContent(): any {
        let obj: any = {
            'I': this.ImageURL
        }

        if (this.ImageWidth !== -1) {
            obj['W'] = this.ImageWidth;
        }

        if (this.ImageHeight !== -1) {
            obj['H'] = this.ImageHeight;
        }

        return obj;
    }
}

export class SharpTextFragment extends SharpFragment {
    constructor(
        public Text: string = '',
        public Description: string = ''
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.Text = rawData['T'] || '';
        this.Description = rawData['DE'] || '';
    }

    toRawContent(): any {
        let obj: any = {
            'T': this.Text
        }

        if (this.Description !== '') {
            obj['DE'] = this.Description;
        }

        return obj;
    }
}

export class SharpAttachment implements ChatAttachment {

    constructor(
        public Question: string = '',
        public RedirectURL: string = '',
        public ContentType: SharpContentType = SharpContentType.NONE,
        public ContentList: SharpContent[] = [],
        public MainImage?: SharpImageFragment
    ) {
        
    }

    get RequiredMessageType() {
        return MessageType.Search;
    }

    readAttachment(rawJson: any): void {
        this.Question = rawJson['Q'];

        this.ContentType = rawJson['V'] || SharpContentType.NONE;

        if (rawJson['I']) {
            this.MainImage = new SharpImageFragment();
            this.MainImage.readRawContent(rawJson);
        }

        this.RedirectURL = rawJson['L'];

        this.ContentList = [];

        if (rawJson['R']) {
            let list: any[] = rawJson['R'];

            for (let rawContent of list) {
                let content: SharpContent;

                switch(this.ContentType) {
                    case SharpContentType.VIDEO_CLIP: content = new SharpVideoContent(); break;
                    
                    case SharpContentType.LIST:
                    case SharpContentType.IMAGE: content = new SharpImageContent(); break;

                    case SharpContentType.MOVIE: content = new SharpMovieContent(); break;

                    case SharpContentType.WEATHER: 
                    default: continue;
                }

                content.readRawContent(rawContent);

                this.ContentList.push(content);
            }
        }
    }

    toJsonAttachment() {
        let obj: any = {
            'Q': this.Question,
            'V': this.ContentType,
            'L': this.RedirectURL
        };

        if (this.MainImage) {
            Object.assign(obj, this.MainImage.toRawContent());
        }

        if (this.ContentList.length > 0) {
            let rawList = [];

            for (let content of this.ContentList) {
                rawList.push(content.toRawContent());
            }

            obj['R'] = rawList;
        }

        return obj;
    }

}

export class SharpImageContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public Image?: SharpImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        if (rawData['I']) {
            this.Image = new SharpImageFragment();
            this.Image.readRawContent(rawData);
        }
        
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        return obj;
    }

}

export class SharpMovieContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public StarRate: string = '',
        public ExtraInfoList: SharpTextFragment[] = [],
        public ImageList: SharpImageFragment[] = []
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        if (rawData['IL']) {
            this.ImageList = [];

            for (let rawImage of rawData['IL']) {
                if (!rawImage) continue;
                
                let img = new SharpImageFragment();
                img.readRawContent(rawImage);
                this.ImageList.push(img);
            }
            
        }

        if (rawData['DL']) {
            this.ExtraInfoList = [];

            for (let rawText of rawData['DL']) {
                if (!rawText) continue;
                
                let text = new SharpTextFragment();
                text.readRawContent(rawText);
                this.ExtraInfoList.push(text);
            }
        }
        
        this.StarRate = rawData['ST'];
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.ImageList.length > 0) {
            let list = [];
            for (let image of this.ImageList) {
                list.push(image.toRawContent());
            }

            obj['IL'] = list;
        }

        if (this.ExtraInfoList.length > 0) {
            let list = [];
            for (let text of this.ExtraInfoList) {
                list.push(text.toRawContent());
            }

            obj['DL'] = list;
        }

        obj['ST'] = this.StarRate;

        return obj;
    }

}

export class SharpVideoContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public PlayTime: number = 0,
        public Image?: SharpImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.PlayTime = rawData['PT'] || 0;

        if (rawData['I']) {
            this.Image = new SharpImageFragment();
            this.Image.readRawContent(rawData);
        }

        this.RedirectURL = rawData['L'];
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL,
            'PT': this.PlayTime
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        return obj;
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
        public User: ChatUser
    ) {
        
    }

    get ContentType() {
        return 'mention';
    }

}

export class ReplyAttachment implements ChatAttachment {

    constructor(
        public SourceType: MessageType = MessageType.Text,
        public SourceLogId: Long = Long.ZERO,
        public SourceUserId: Long = Long.ZERO,
        public SourceMessage: string = '',
        public SourceMentionList: MentionContentList[] = [],
        public SourceLinkId: Long = Long.ZERO // ONLY ON OPENPROFILE ?!

    ) {

    }

    get RequiredMessageType() {
        return MessageType.Reply;
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

        return obj;
    }

    static fromChat(chat: Chat): ReplyAttachment {
        return new ReplyAttachment(chat.Type, chat.LogId, chat.Sender.Id, chat.Text, chat.getMentionContentList());
    }
}