/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class ChatAttachment {
    
    abstract readAttachment(rawJson: any): void;

}

export class PhotoAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',

        private width: number = 0,
        private height: number = 0,
    
        private imageURL: string = '',
        private thumbnailURL: string = '',
    
        private thumbnailWidth: number = 0,
        private thumbnailHeight: number = 0,
    
        private size: number = 0
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

}

export class VideoAttachment extends ChatAttachment {

    constructor(
        private keyPath: string = '',

        private width: number = 0,
        private height: number = 0,
    
        private videoURL: string = '',
    
        private size: number = 0
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

}

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

}