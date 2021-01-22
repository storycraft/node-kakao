/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelMeta, NormalChannelInfo, OpenChannelInfo, SetChannelMeta } from "../../channel/channel-info";
import { ChannelManageSession, ChannelSession, ChannelTemplate, OpenChannelSession } from "../../channel/channel-session";
import { Chat, Chatlog, ChatLogged, ChatLogLinked } from "../../chat/chat";
import { KnownChatType } from "../../chat/chat-type";
import { CommandSession } from "../../network/request-session";
import { DefaultReq } from "../../packet/bson-data-codec";
import { ChatInfoRes } from "../../packet/chat/chat-info";
import { CreateRes } from "../../packet/chat/create";
import { ForwardRes } from "../../packet/chat/forward";
import { SetMetaRes } from "../../packet/chat/set-meta";
import { WriteRes } from "../../packet/chat/write";
import { KnownDataStatusCode } from "../../packet/status-code";
import { ChannelInfoStruct, ChannelMetaType, NormalChannelInfoExtra, OpenChannelInfoExtra } from "../../packet/struct/channel";
import { WrappedChannelInfo, WrappedOpenChannelInfo } from "../../packet/struct/wrapped/channel";
import { WrappedChatlog } from "../../packet/struct/wrapped/chat";
import { AsyncCommandResult } from "../../request/command-result";
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

    async sendChat(chat: Chat | string): AsyncCommandResult<ChatLogLinked> {
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

        const res = await this._session.request<WriteRes>('WRITE', data);

        if (res.status === KnownDataStatusCode.SUCCESS) {
            return { status: res.status, success: true, result: { logId: res.logId, prevLogId: res.prevId } };
        } else {
            return { status: res.status, success: false };
        }
    }

    async forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
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

        const res = await this._session.request<ForwardRes>('FORWARD', data);

        if (res.status === KnownDataStatusCode.SUCCESS) {
            return { success: true, status: res.status, result: new WrappedChatlog(res.chatLog) };
        } else {
            return { success: false, status: res.status };
        }
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

    async setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta> {
        const res = await this._session.request<SetMetaRes>(
            'SETMETA',
            {
                'chatId': this._channel.channelId,
                'type': type,
                'content': typeof meta === 'string' ? meta : meta.content
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        return {
            success: true,
            status: res.status,
            result: { ...res.meta }
        };
    }

    async getChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
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

    async getChannelInfo(): AsyncCommandResult<OpenChannelInfo> {
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

    async createChannel(template: ChannelTemplate): AsyncCommandResult<[Channel, NormalChannelInfo | null]> {
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

    async createMemoChannel(): AsyncCommandResult<[Channel, NormalChannelInfo | null]> {
        const res = await this._session.request<CreateRes>('CREATE', { 'memoChat': true });
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };
        
        let result: [Channel, NormalChannelInfo | null] = [ { channelId: res.chatId }, null ];
        if (res.chatRoom) result[1] = (new WrappedChannelInfo(res.chatRoom as ChannelInfoStruct & NormalChannelInfoExtra));

        return { status: res.status, success: true, result };
    }

    async leaveChannel(channel: Channel, block: boolean = false): AsyncCommandResult<Long> {
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