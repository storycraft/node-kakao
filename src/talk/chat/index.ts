/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Chatlog, getOriginalType, isDeletedChat } from "../../chat";
import { ChannelUser } from "../../user";
import { TalkChannel } from "../channel";

/**
 * Store Chatlog and provides convenient methods.
 */
export class TalkChatData {

    constructor(private _chat: Chatlog) {

    }

    /**
     * Get chatlog object
     */
    get chat(): Readonly<Chatlog> {
        return this._chat;
    }

    /**
     * The chat object's type property has the type value bit masked when the chat is deleted.
     * @returns the original chat type
     */
    get originalType() {
        return getOriginalType(this._chat.type);
    }

    /**
     * Get url list in chat. Can be used to generate url preview.
     * It is not for detecting urls.
     */
    get urls(): string[] {
        if (!this._chat.attachment || !Array.isArray(this._chat.attachment['urls'])) return [];

        return this._chat.attachment['urls'];
    }

    /**
     * Get mention list
     */
    get mentions(): TalkChatMention[] {
        if (!this._chat.attachment || !Array.isArray(this._chat.attachment.mentions)) return [];

        return this._chat.attachment.mentions;
    }

    /**
     * Forward chat to another channel
     *
     * @param channel
     */
    forwardTo(channel: TalkChannel) {
        channel.forwardChat(this._chat);
    }

    /**
     * @returns true when the chat is deleted.
     */
    isDeleted() {
        return isDeletedChat(this._chat.type);
    }

    /**
     * Check if any users are mentioned.
     *
     * @param users Users to find
     * @returns true if any one is mentioned
     */
    isMentioned(...users: ChannelUser[]) {
        const mentions = this.mentions;
        if (mentions.length < 1) return false;
        
        for (const mention of mentions) {
            const userId = mention.user_id;

            for (const user of users) {
                if (user.userId.eq(userId)) return true;
            }
        }

        return false;
    }

}

/**
 * Raw chat mention typings
 */
export interface TalkChatMention {

    /**
     * Index list
     */
    at: number[];

    /**
     * Mention text length, except @ prefix.
     */
    len: number;

    /**
     * Target user id
     */
    user_id: Long | number;

}