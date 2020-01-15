import { KakaoAPI } from "../../kakao-api";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class ChatAttachment {
    
    abstract readAttachment(rawJson: any): void;

    abstract toJsonAttachment(): any;

}

export class PhotoAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',
        private width: number = 0,
        private height: number = 0,
        private imageURL: string = '',
        private size: number = -1,

        //NO NEED TO FILL PROPERTIES AFTER THIS COMMENT
        
        private thumbnailURL: string = '',

        private thumbnailWidth: number = -1,
        private thumbnailHeight: number = -1,
        ) {
        super();
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

    toJsonAttachment() {
        let obj: any = {
            'url': this.imageURL,
            'k': this.KeyPath,
            'w': this.width,
            'h': this.height
        };

        if (this.thumbnailURL !== '') {
            obj['thumbnailUrl'] = this.thumbnailURL;
        }

        if (this.thumbnailWidth !== -1) {
            obj['thumbnailWidth'] = this.thumbnailWidth;
        }

        if (this.thumbnailHeight !== -1) {
            obj['thumbnailHeight'] = this.thumbnailHeight;
        }

        if (this.size !== -1) {
            obj['size'] = this.size;
        }

        return obj;
    }

}

export class VideoAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',

        private width: number = 0,
        private height: number = 0,
    
        private videoURL: string = '',
    
        private size: number = -1
        ) {
        super();
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

    get VideoURL() {
        return this.videoURL;
    }

    get Size() {
        return this.size;
    }

    readAttachment(rawJson: any) {
        this.keyPath = rawJson['tk'];

        this.width = rawJson['w'];
        this.height = rawJson['h'];

        this.videoURL = rawJson['url'];
        
        this.size = rawJson['s'];
    }

    toJsonAttachment() {
        let obj: any = {
            'url': this.videoURL,
            'tk': this.KeyPath,
            'w': this.width,
            'h': this.height
        };

        if (this.size !== -1) {
            obj['s'] = this.size;
        }

        return obj;
    }

}

export class FileAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',
        private fileURL: string = '',
        private Name: string = '',
        private size: number = -1
    ) {
        super();
    }

    readAttachment(rawJson: any): void {
        this.keyPath = rawJson['k'];

        this.fileURL = rawJson['url'];
        this.Name = rawJson['name'];
        
        this.size = rawJson['s'];
    }
    
    toJsonAttachment() {
        let obj: any = {
            'url': this.fileURL,
            'name': this.Name,
            'k': this.keyPath,
        };

        if (this.size !== -1) {
            obj['s'] = obj['size'] = this.size;
        }

        return obj;
    }

}

export class AudioAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',
        private audioURL: string = '',
        private size: number = -1
    ) {
        super();
    }

    readAttachment(rawJson: any): void {
        this.keyPath = rawJson['tk'];

        this.audioURL = rawJson['url'];
        
        this.size = rawJson['s'];
    }
    
    toJsonAttachment() {
        let obj: any = {
            'url': this.audioURL,
            'tk': this.keyPath,
        };

        if (this.size !== -1) {
            obj['s'] = this.size;
        }

        return obj;
    }

}

export class EmoticonAttachment extends ChatAttachment {

    constructor(
        private name: string = '',
        private path: string = '',
        private type: string = '',
        private description: string = '',
        private stopAt: number = 0
    ) {
        super();
    }

    get Name() {
        return this.name;
    }

    get Path() {
        return this.path;
    }

    getEmoticonURL(region: string = 'kr') {
        return KakaoAPI.getEmoticonImageURL(this.path, region);
    }

    get Type() {
        return this.type;
    }

    get Description() {
        return this.description;
    }

    get StopAt() {
        return this.stopAt;
    }

    readAttachment(rawJson: any) {
        this.path = rawJson['path'];
        this.name = rawJson['name'];
        this.type = rawJson['type'];
        this.description = rawJson['alt'];
        this.stopAt = rawJson['s'];
    }

    toJsonAttachment() {
        let obj: any = {
            'path': this.path,
            'name': this.name,
            'type': this.type,
            's': this.stopAt
        };

        if (this.description !== '') {
            obj['alt'] = this.description;
        }

        return obj;
    }

}


//unused
export class LongTextAttachment extends ChatAttachment {

    constructor(
        private path: string = '',
        private keyPath: string = '',
        private size: number = 0,
        private sd: boolean = false//whats this
    ) {
        super();
    }

    get Path() {
        return this.path;
    }

    get KeyPath() {
        return this.keyPath;
    }

    get Size() {
        return this.size;
    }

    get SD() {
        return this.sd;
    }

    readAttachment(rawJson: any) {
        this.path = rawJson['path'];
        this.keyPath = rawJson['k'];
        this.size = rawJson['s'];
        this.sd = rawJson['sd'];
    }

    toJsonAttachment() {
        let obj: any = {
            'path': this.path,
            'k': this.KeyPath
        };

        if (this.size) {
            obj['size'] = this.size;
        }

        if (this.sd) {
            obj['sd'] = this.sd;
        }

        return obj;
    }

}

export class SharpAttachment extends ChatAttachment {

    constructor(
        private question: string = '',
        private redirectURL: string = '',
        private contentType: string = '',
        private imageURL: string = '',
        private imageWidth: number = -1,
        private imageHeight: number = -1,
        private contentList: SharpContent[] = []
    ) {
        super();
    }

    get Question() {
        return this.question;
    }

    get ImageURL() {
        return this.imageURL;
    }

    get ImageWidth() {
        return this.imageWidth;
    }

    get ImageHeight() {
        return this.imageHeight;
    }

    get RedirectURL() {
        return this.redirectURL;
    }

    get ContentType() {
        return this.contentType;
    }

    get ContentList() {
        return this.contentList;
    }

    readAttachment(rawJson: any): void {
        this.question = rawJson['Q'];

        this.contentType = rawJson['V'];

        this.imageURL = rawJson['I'] || '';
        this.imageWidth = rawJson['W'] || -1;
        this.imageHeight = rawJson['H'] || -1;

        this.redirectURL = rawJson['L'];

        this.contentList = [];

        if (rawJson['R']) {
            let list: any[] = rawJson['R'];

            for (let rawContent of list) {
                let content = new SharpContent();

                content.readRawContent(rawContent);

                this.contentList.push(content);
            }
        }
    }

    toJsonAttachment() {
        let obj: any = {
            'Q': this.question,
            'V': this.contentType,
            'L': this.redirectURL
        };

        if (this.imageURL !== '') {
            obj['I'] = this.imageURL;
        }

        if (this.imageWidth !== -1) {
            obj['W'] = this.imageWidth;
        }

        if (this.imageHeight !== -1) {
            obj['H'] = this.imageHeight;
        }

        if (this.contentList.length > 0) {
            let rawList = [];

            for (let content of this.contentList) {
                rawList.push(content.toRawContent());
            }

            obj['R'] = rawList;
        }

        return obj;
    }

}

export class SharpContent {

    constructor(
        private description: string = '',
        private type: string = '',
        private redirectURL: string = '',
        private imageURL: string = '',
        private imageWidth: number = -1,
        private imageHeight: number = -1,
    ) {

    }

    get Description() {
        return this.description;
    }

    get Type() {
        return this.type;
    }

    get ImageURL() {
        return this.imageURL;
    }

    get ImageWidth() {
        return this.imageWidth;
    }

    get ImageHeight() {
        return this.imageHeight;
    }

    get RedirectURL() {
        return this.redirectURL;
    }

    readRawContent(rawData: any) {
        this.description = rawData['D'];

        this.type = rawData['T'];

        this.imageURL = rawData['I'] || '';
        this.imageWidth = rawData['W'] || -1;
        this.imageHeight = rawData['H'] || -1;

        this.redirectURL = rawData['L'];
    }

    toRawContent(): any {
        let obj: any = {
            'D': this.description,
            'T': this.type,
            'L': this.redirectURL
        };

        if (this.imageURL !== '') {
            obj['I'] = this.imageURL;
        }

        if (this.imageWidth !== -1) {
            obj['W'] = this.imageWidth;
        }

        if (this.imageHeight !== -1) {
            obj['H'] = this.imageHeight;
        }

        return obj;
    }

}