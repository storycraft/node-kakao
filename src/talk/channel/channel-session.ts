/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSession } from "../../network/loco-session";
import { DefaultReq } from "../../packet/bson-data-codec";
import { createIdGen } from "../../util/id-generator";
import { Chat, ChatLogged } from "../chat/chat";
import { KnownChatType } from "../chat/chat-type";
import { Sessioned } from "../sessioned";
import { Channel, OpenChannel } from "./channel";

export class ChannelSession implements Sessioned, Channel {

    private _channel: Channel;
    private _session: LocoSession;

    private _idGenerator: Generator<number>;

    constructor(channel: Channel, session: LocoSession) {
        this._channel = channel;
        this._session = session;

        this._idGenerator = createIdGen();
    }
    
    get channelId() {
        return this._channel.channelId;
    }

    get session() {
        return this._session;
    }

    /**
    * Send chat to channel.
    * Perform WRITE command.
    * 
    * @param chat 
     */
    sendChat(chat: Chat | string) {
        if (typeof chat === 'string') {
            chat = { type: KnownChatType.TEXT, text: chat } as Chat;
        }

        const data: DefaultReq = {
            'chatId': this.channelId,
            'msgId': this._idGenerator.next().value,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = chat.attachment;
        }

        return this.session.sendData('WRITE', data);
    }

    /**
     * Forward chat to channel.
     * Perform FORWARD command.
     * 
     * @param chat 
     */
    forwardChat(chat: Chat) {
        const data: DefaultReq = {
            'chatId': this.channelId,
            'msgId': this._idGenerator.next().value,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = chat.attachment;
        }

        return this.session.sendData('FORWARD', data);
    }

    /**
     * Delete chat from server.
     * It only works to client user chat.
     * 
     * @param chat Chat to delete
     */
    deleteChat(chat: ChatLogged) {
        return this.session.sendData('DELETEMSG', {
            'chatId': this.channelId,
            'logId': chat.logId
        });
    }
    
    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged) {
        return this.session.sendData('NOTIREAD', {
            'chatId': this.channelId,
            'watermark': chat.logId
        });
    }

}

export class OpenChannelSession implements Sessioned, OpenChannel {

    private _channel: OpenChannel;
    private _session: LocoSession;

    constructor(channel: OpenChannel, session: LocoSession) {
        this._channel = channel;
        this._session = session;
    }
    
    get channelId() {
        return this._channel.channelId;
    }

    get linkId() {
        return this._channel.linkId;
    }

    get session() {
        return this._session;
    }

    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged) {
        return this.session.sendData('NOTIREAD', {
            'chatId': this.channelId,
            'li': this.linkId,
            'watermark': chat.logId,
        });
    }

};