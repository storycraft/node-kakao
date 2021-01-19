/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandSession } from "../network/request-session";
import { DefaultReq, DefaultRes } from "../packet/bson-data-codec";
import { createIdGen } from "../util/id-generator";
import { Chat, ChatLogged } from "../chat/chat";
import { KnownChatType } from "../chat/chat-type";
import { Channel, OpenChannel } from "./channel";
import { CommandResult } from "../request/command-result";

/**
 * Classes which provides channel session operations should implement this.
 */
export interface ChannelSessionOp {

    /**
    * Send chat to channel.
    * Perform WRITE command.
    * 
    * @param chat 
     */
    sendChat(chat: Chat | string): Promise<DefaultRes>;

    /**
     * Forward chat to channel.
     * Perform FORWARD command.
     * 
     * @param chat 
     */
    forwardChat(chat: Chat): Promise<DefaultRes>;

    /**
     * Delete chat from server.
     * It only works to client user chat.
     * 
     * @param chat Chat to delete
     */
    deleteChat(chat: ChatLogged): Promise<CommandResult>;
    
    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): Promise<CommandResult>;

}

/**
 * Classes which provides openchannel session operations should implement this.
 */
export interface OpenChannelSessionOp {

    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): Promise<DefaultRes>;

}

/**
 * Default ChannelSessionOp implementation
 */
export class ChannelSession implements ChannelSessionOp {

    private _channel: Channel;
    private _session: CommandSession;

    private _idGenerator: Generator<number>;

    constructor(channel: Channel, session: CommandSession) {
        this._channel = channel;
        this._session = session;

        this._idGenerator = createIdGen();
    }

    sendChat(chat: Chat | string) {
        if (typeof chat === 'string') {
            chat = { type: KnownChatType.TEXT, text: chat } as Chat;
        }

        const data: DefaultReq = {
            'chatId': this._channel.channelId,
            'msgId': this._idGenerator.next().value,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = chat.attachment;
        }

        return this._session.request('WRITE', data);
    }

    async forwardChat(chat: Chat) {
        const data: DefaultReq = {
            'chatId': this._channel.channelId,
            'msgId': this._idGenerator.next().value,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = chat.attachment;
        }

        return { status: (await this._session.request('FORWARD', data)).status };
    }

    async deleteChat(chat: ChatLogged) {
        return {
            status: (await this._session.request(
                'DELETEMSG',
                {
                    'chatId': this._channel.channelId,
                    'logId': chat.logId
                }
            )).status
        };
    }
    
    async markRead(chat: ChatLogged) {
        return {
            status: (await this._session.request(
                'NOTIREAD',
                {
                    'chatId': this._channel.channelId,
                    'watermark': chat.logId
                }
            )).status
        };
    }

}

/**
 * Default OpenChannelSessionOp implementation.
 */
export class OpenChannelSession implements OpenChannelSessionOp {

    private _channel: OpenChannel;
    private _session: CommandSession;

    constructor(channel: OpenChannel, session: CommandSession) {
        this._channel = channel;
        this._session = session;
    }
    
    async markRead(chat: ChatLogged) {
        return {
            status: (await this._session.request(
                'NOTIREAD',
                {
                    'chatId': this._channel.channelId,
                    'li': this._channel.linkId,
                    'watermark': chat.logId
                }
            )).status
        };
    }

};