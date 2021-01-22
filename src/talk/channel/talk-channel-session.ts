/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../../channel/channel";
import { NormalChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { ChannelManageSession, ChannelSession, ChannelTemplate, OpenChannelSession } from "../../channel/channel-session";
import { Chat, ChatLogged } from "../../chat/chat";
import { KnownChatType } from "../../chat/chat-type";
import { CommandSession } from "../../network/request-session";
import { DefaultReq, DefaultRes } from "../../packet/bson-data-codec";
import { ChatInfoRes } from "../../packet/chat/chat-info";
import { CreateRes } from "../../packet/chat/create";
import { KnownDataStatusCode } from "../../packet/status-code";
import { ChannelInfoStruct, ChannelMetaType, NormalChannelInfoExtra, OpenChannelInfoExtra } from "../../packet/struct/channel";
import { WrappedChannelInfo, WrappedOpenChannelInfo } from "../../packet/struct/wrapped/channel";
import { CommandResult } from "../../request/command-result";
import { createIdGen } from "../../util/id-generator";

/**
 * Default ChannelSession implementation
 */
export class TalkChannelSession implements ChannelSession {

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

    async setMeta(type: ChannelMetaType, content: string): Promise<CommandResult<DefaultRes>> {
        const res = await this._session.request<ChatInfoRes>(
            'SETMETA',
            {
                'chatId': this._channel.channelId,
                'type': type,
                'content': content
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        return {
            success: true,
            status: res.status,
            result: res
        };
    }

    async getChannelInfo(): Promise<CommandResult<NormalChannelInfo>> {
        const res = await this._session.request<ChatInfoRes>(
            'CHATINFO',
            {
                'chatId': this._channel.channelId,
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        return {
            success: true,
            status: res.status,
            result: new WrappedChannelInfo(res.chatInfo as ChannelInfoStruct & NormalChannelInfoExtra)
        };
    }

}

/**
 * Default OpenChannelSession implementation.
 */
export class TalkOpenChannelSession implements OpenChannelSession {

    private _channel: OpenChannel;
    private _session: CommandSession;

    constructor(channel: OpenChannel, session: CommandSession) {
        this._channel = channel;
        this._session = session;
    }
    
    async markRead(chat: ChatLogged) {
        const status = (await this._session.request(
            'NOTIREAD',
            {
                'chatId': this._channel.channelId,
                'li': this._channel.linkId,
                'watermark': chat.logId
            }
        )).status;

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status,
        };
    }

    async getChannelInfo(): Promise<CommandResult<OpenChannelInfo>> {
        const res = await this._session.request<ChatInfoRes>(
            'CHATINFO',
            {
                'chatId': this._channel.channelId,
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        return {
            success: true,
            status: res.status,
            result: new WrappedOpenChannelInfo(res.chatInfo as ChannelInfoStruct & OpenChannelInfoExtra)
        };
    }

};

/**
 * Default ChannelManageSession implementation.
 */
export class TalkChannelManageSession implements ChannelManageSession {

    private _session: CommandSession;

    constructor(session: CommandSession) {
        this._session = session;
    }

    async createChannel(template: ChannelTemplate): Promise<CommandResult<[Channel, NormalChannelInfo | null]>> {
        const data: Record<string, any> = {
            'memberIds': template.userList.map(user => user.userId)
        };

        if (template.name) data['nickname'] = template.name;
        if (template.profileURL) data['profileImageUrl'] = template.profileURL;

        const res = await this._session.request<CreateRes>('CREATE', data);
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        let result: [Channel, NormalChannelInfo | null] = [ { channelId: res.chatId }, null ];
        if (res.chatRoom) result[1] = (new WrappedChannelInfo(res.chatRoom as ChannelInfoStruct & NormalChannelInfoExtra));

        return { status: res.status, success: true, result };
    }

    async createMemoChannel(): Promise<CommandResult<[Channel, NormalChannelInfo | null]>> {
        const res = await this._session.request<CreateRes>('CREATE', { 'memoChat': true });
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };
        
        let result: [Channel, NormalChannelInfo | null] = [ { channelId: res.chatId }, null ];
        if (res.chatRoom) result[1] = (new WrappedChannelInfo(res.chatRoom as ChannelInfoStruct & NormalChannelInfoExtra));

        return { status: res.status, success: true, result };
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