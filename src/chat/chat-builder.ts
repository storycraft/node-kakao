/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from "./chat";
import { ChatType, KnownChatType } from "./chat-type";

/**
 * Build Chat object
 */
export class ChatBuilder {

    private _attachment: Record<string, any>;

    constructor(private _type: ChatType, private _text: string = '') {
        this._attachment = {};
    }

    /**
     * Set chat text
     * @param text 
     */
    text(text: string): this {
        this._text = text;

        return this;
    }

    /**
     * Set json attachment
     * @param attachment 
     */
    attachment(attachment: Record<string, any>): this {
        this._attachment = attachment;
        return this;
    }

    /**
     * Build into chat
     */
    build(): Chat {
        const chat: Chat = {
            type: this._type,
            text: this._text
        };

        if (this._attachment) {
            chat['attachment'] = this._attachment;
        }

        return chat;
    }

}