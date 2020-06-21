/*
 * Created on Sun May 31 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatAttachment, AttachmentContent } from "./chat-attachment";
import { ChatType } from "../chat-type";

export class RichFeedAttachment implements ChatAttachment {

    constructor(
        public Text: string = '',
        public Icon?: string,
        public Image?: string,
        public Action?: RichActionContent,
        public ImageAction?: RichActionContent,
        public Description?: RichDescContent,
    ) {
        
    }
    readAttachment(rawJson: any): void {
        this.Text = rawJson['text'] || '';

        if (rawJson['icon']) this.Icon = rawJson['icon'];

        if (rawJson['image']) this.Image = rawJson['image'];
        
        if (rawJson['description']) {
            this.Description = new RichDescContent();
            this.Description.readRawContent(rawJson['description']);
        }

        if (rawJson['action']) {
            this.Action = new RichActionContent();
            this.Action.readRawContent(rawJson['action']);
        }

        if (rawJson['imageAction']) {
            this.ImageAction = new RichActionContent();
            this.ImageAction.readRawContent(rawJson['imageAction']);
        }

    }

    toJsonAttachment() {
        let obj = {
            'text': this.Text
        } as any;

        if (this.Icon) obj['icon'] = this.Icon;

        if (this.Image) obj['image'] = this.Image;
        
        if (this.Description) obj['description'] = this.Description.toRawContent();

        if (this.Action) obj['action'] = this.Action.toRawContent();

        if (this.ImageAction) obj['imageAction'] = this.ImageAction.toRawContent();

        return obj;
    }

    get RequiredMessageType() {
        return ChatType.Feed;
    }
    

}

export enum RichActionType {

    APP = 'app'

}

export class RichDescContent implements AttachmentContent {

    constructor(
        public Nickname: string = '',
        public Message: string = ''
    ) {

    }

    readRawContent(rawData: any): void {
        this.Nickname = rawData['nickname'] || '';
        this.Message = rawData['message'] || '';
    }

    toRawContent() {
        return {
            'nickname': this.Nickname,
            'message': this.Message
        }
    }

}

export class RichActionContent implements AttachmentContent {

    constructor(
        public Action: string = '',
        public URL: string = '',
        public URLAndroid?: string,
        public URLIos?: string
    ) {

    }

    readRawContent(rawData: any): void {
        this.Action = rawData['action'] || ''; 
        this.URL = rawData['url'] || ''; 

        if ( rawData['iu'] ) { 
            if ( rawData['iu']['android'] ) { 
                this.URLAndroid = rawData['iu']['android'];
            }
            if ( rawData['iu']['ios'] ) { 
                this.URLIos = rawData['iu']['ios'];
            }
        }
    }

    toRawContent() {
        let obj = {
            'action': this.Action,
            'url': this.URL
        } as any;

        if (this.URLAndroid || this.URLIos) {
            let iu = {} as any;

            if (this.URLAndroid) iu['android'] = this.URLAndroid;
            if (this.URLIos) iu['ios'] = this.URLIos;

            obj['iu'] = iu;
        }

        return obj;
    }
    
}
