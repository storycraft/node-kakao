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
import { Channel } from "./channel";
import { CommandResult } from "../request/command-result";
import { Long } from "..";
import { ChannelUser } from "../user/channel-user";
import { KnownDataStatusCode } from "../packet/status-code";

export interface ChannelTemplate {

    userList: ChannelUser[],

    name?: string;
    profileURL?: string;

}

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
 * Classes which can manage channels should implement this. 
 */
export interface ChannelManageSessionOp {

    /**
     * Create channel.
     * Perform CREATE command.
     * 
     * @param userList Users to be included.
     */
    createChannel(template: ChannelTemplate): Promise<DefaultRes>;

    /**
     * Create memo channel.
     * Perform CREATE command.
     */
    createMemoChannel(): Promise<DefaultRes>;

   /**
    * Leave channel.
    * Perform LEAVE command.
    * Returns last channel token on success.
    * 
    * @param channel Channel to leave.
    * @param block If true block channel to prevent inviting.
    */
    leaveChannel(channel: Channel, block?: boolean): Promise<CommandResult<Long>>;

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

        const status = (await this._session.request('FORWARD', data)).status;

        return { success: status === KnownDataStatusCode.SUCCESS, status };
    }

    async deleteChat(chat: ChatLogged) {
        const status = (await this._session.request(
            'DELETEMSG',
            {
                'chatId': this._channel.channelId,
                'logId': chat.logId
            }
        )).status;

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status
        };
    }
    
    async markRead(chat: ChatLogged) {
        const status = (await this._session.request(
            'NOTIREAD',
            {
                'chatId': this._channel.channelId,
                'watermark': chat.logId
            }
        )).status;
        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status
        };
    }

}

/**
 * Default ChannelManageSessionOp implementation.
 */
export class ChannelManageSession implements ChannelManageSessionOp {

    private _session: CommandSession;

    constructor(session: CommandSession) {
        this._session = session;
    }

    createChannel(template: ChannelTemplate) {
        const data: Record<string, any> = {
            'memberIds': template.userList.map(user => user.userId)
        };

        if (template.name) data['nickname'] = template.name;
        if (template.profileURL) data['profileImageUrl'] = template.profileURL;

        return this._session.request('CREATE', data);
    }

    createMemoChannel() {
        return this._session.request('CREATE', { 'memoChat': true });
    }

    async leaveChannel(channel: Channel, block: boolean = false): Promise<CommandResult<Long>> {
        const res = await this._session.request(
            'LEAVE',
            {
                'chatId': channel.channelId,
                'block': block
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res['lastTokenId'] };
    }

}