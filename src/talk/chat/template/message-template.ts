import { ChatType } from "../chat-type";
import { ChatAttachment, EmoticonAttachment, ChatContent, ReplyAttachment } from "../attachment/chat-attachment";
import { JsonUtil } from "../../../util/json-util";
import { ChatBuilder } from "../chat-builder";

/*
 * Created on Fri Jan 03 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MessageTemplate {

    readonly Valid: boolean;

    getMessageType(): ChatType;

    getPacketText(): string;
    getPacketExtra(): string;

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

    get Valid() {
        return true;
    }

    getMessageType() {
        return this.attachment.RequiredMessageType;
    }

    getPacketText() {
        return this.packetText;
    }

    protected getRawExtra(): any {
        return { ...this.textExtra, ...this.attachment.toJsonAttachment() };
    }

    getPacketExtra() {
        return JsonUtil.stringifyLoseless(this.getRawExtra());
    }

}

export class ReplyContentTemplate extends AttachmentTemplate {

    constructor(
        reply: ReplyAttachment,
        private content: ChatAttachment,
        private attachOnly: boolean,
        ...textFormat: (string | ChatContent)[]
    ) {
        super(reply, ...textFormat);
    }

    get AttachOnly() {
        return this.attachOnly;
    }

    set AttachOnly(flag) {
        this.attachOnly = flag;
    }

    getReplyContent() {
        return {
            'attach_type': this.content.RequiredMessageType,
            'attach_only': this.attachOnly,
            'attach_content': this.content.toJsonAttachment()
        }
    }

    protected getRawExtra() {
        return Object.assign(super.getRawExtra(), this.getReplyContent());
    }

}