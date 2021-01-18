import { ChatType } from "../chat-type";
import { ChatAttachment, ChatContent, ReplyAttachment } from "../attachment/chat-attachment";
import { JsonUtil } from "../../../util/json-util";
import { ChatBuilder } from "../chat-builder";
import { RichFeedAttachment } from "../attachment/rich-feed-attachment";
import { ChatFeeds } from "../chat-feed";

/*
 * Created on Fri Jan 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MessageTemplate {

    getType(): ChatType;

    getText(): string;
    getExtra(): string;

}

export class AttachmentTemplate implements MessageTemplate {

    private packetText: string;
    private textExtra: any;

    constructor(
        private attachment: ChatAttachment,
        ...textFormat: (string | ChatContent)[]
    ) {
        let msg = ChatBuilder.buildMessage(...textFormat);

        this.packetText = msg.text;
        this.textExtra = msg.extra;
    }

    get Attachment() {
        return this.attachment;
    }

    set Attachment(attachment) {
        this.attachment = attachment;
    }

    get Text() {
        return this.packetText;
    }

    setText(...textFormat: (string | ChatContent)[]) {
        let msg = ChatBuilder.buildMessage(...textFormat);

        this.packetText = msg.text;
        this.textExtra = msg.extra;
    }

    getType() {
        return this.attachment.RequiredMessageType;
    }

    getText() {
        return this.packetText;
    }

    protected getRawExtra(): any {
        return { ...this.textExtra, ...this.attachment.toJsonAttachment() };
    }

    getExtra() {
        return JsonUtil.stringifyLoseless(this.getRawExtra());
    }

}

export class ReplyContentTemplate extends AttachmentTemplate {

    constructor(
        reply: ReplyAttachment,
        private content: ChatAttachment,
        ...textFormat: (string | ChatContent)[]
    ) {
        super(reply, ...textFormat);
    }
    
    getReplyContent() {
        return {
            'attach_type': this.content.RequiredMessageType,
            'attach_content': this.content.toJsonAttachment()
        }
    }

    protected getRawExtra() {
        return Object.assign(super.getRawExtra(), this.getReplyContent());
    }

}