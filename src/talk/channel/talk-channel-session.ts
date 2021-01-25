/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel } from "../../channel/channel";
import { ChannelMeta, NormalChannelInfo, SetChannelMeta } from "../../channel/channel-info";
import { ChannelManageSession, ChannelSession, ChannelTemplate } from "../../channel/channel-session";
import { Chat, Chatlog, ChatLogged, ChatLogLinked } from "../../chat/chat";
import { KnownChatType } from "../../chat/chat-type";
import { TalkSession } from "../../client";
import { OpenChannel } from "../../openlink/open-channel";
import { OpenChannelInfo } from "../../openlink/open-channel-info";
import { OpenChannelSession } from "../../openlink/open-channel-session";
import { DefaultReq } from "../../packet/bson-data-codec";
import { ChatInfoRes } from "../../packet/chat/chat-info";
import { ChatOnRoomRes } from "../../packet/chat/chat-on-room";
import { CreateRes } from "../../packet/chat/create";
import { ForwardRes } from "../../packet/chat/forward";
import { GetMemRes } from "../../packet/chat/get-mem";
import { MemberRes } from "../../packet/chat/member";
import { SetMetaRes } from "../../packet/chat/set-meta";
import { WriteRes } from "../../packet/chat/write";
import { KnownDataStatusCode } from "../../packet/status-code";
import { ChannelInfoStruct, ChannelMetaType, NormalChannelInfoExtra, OpenChannelInfoExtra } from "../../packet/struct/channel";
import { NormalMemberStruct, OpenMemberStruct } from "../../packet/struct/user";
import { structToNormalChannelInfo, structToOpenChannelInfo } from "../../packet/struct/wrap/channel";
import { structToChatlog } from "../../packet/struct/wrap/chat";
import { structToChannelUserInfo, structToOpenChannelUserInfo } from "../../packet/struct/wrap/user";
import { AsyncCommandResult } from "../../request/command-result";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../user/channel-user-info";
import { JsonUtil } from "../../util/json-util";

/**
 * Default ChannelSession implementation
 */
export class TalkChannelSession implements ChannelSession {

    private _channel: Channel;
    private _session: TalkSession;

    currentMsgId: number;

    constructor(channel: Channel, session: TalkSession) {
        this._channel = channel;
        this._session = session;

        this.currentMsgId = 0;
    }

    get session() {
        return this._session;
    }

    async sendChat(chat: Chat | string): AsyncCommandResult<ChatLogLinked> {
        if (typeof chat === 'string') {
            chat = { type: KnownChatType.TEXT, text: chat } as Chat;
        }

        const data: DefaultReq = {
            'chatId': this._channel.channelId,
            'msgId': ++this.currentMsgId,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = JsonUtil.stringifyLoseless(chat.attachment);
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
            'msgId': ++this.currentMsgId,
            'msg': chat.text,
            'type': chat.type,
            'noSeen': true,
        };

        if (chat.attachment) {
            data['extra'] = JsonUtil.stringifyLoseless(chat.attachment);
        }

        const res = await this._session.request<ForwardRes>('FORWARD', data);

        if (res.status === KnownDataStatusCode.SUCCESS) {
            return { success: true, status: res.status, result: structToChatlog(res.chatLog) };
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

    async chatON(): AsyncCommandResult<ChatOnRoomRes> {
        const res = await this._session.request<ChatOnRoomRes>(
            'CHATONROOM',
            {
                'chatId': this._channel.channelId,
                'token': Long.ZERO,
                'opt': 0
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };
        
        return { success: true, status: res.status, result: res };
    }

    async getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
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
            result: structToNormalChannelInfo(res.chatInfo as ChannelInfoStruct & NormalChannelInfoExtra)
        };
    }

    async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<ChannelUserInfo[]> {
        const res = await this._session.request<MemberRes>(
            'MEMBER',
            {
                'chatId': this._channel.channelId,
                'memberIds': channelUsers.map(user => user.userId)
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        const result = (res.members as NormalMemberStruct[]).map(member => structToChannelUserInfo(member));

        return { success: true, status: res.status, result };
    }
    
    async getAllLatestUserInfo(): AsyncCommandResult<ChannelUserInfo[]> {
        const res = await this._session.request<GetMemRes>(
            'GETMEM',
            {
                'chatId': this._channel.channelId,
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        const result = (res.members as NormalMemberStruct[]).map(member => structToChannelUserInfo(member));

        return { success: true, status: res.status, result };
    }

}

/**
 * Default OpenChannelSession implementation.
 */
export class TalkOpenChannelSession implements OpenChannelSession {

    private _channel: OpenChannel;
    private _session: TalkSession;

    constructor(channel: OpenChannel, session: TalkSession) {
        this._channel = channel;
        this._session = session;
    }

    get session() {
        return this._session;
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

    async getLatestChannelInfo(): AsyncCommandResult<OpenChannelInfo> {
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
            result: structToOpenChannelInfo(res.chatInfo as ChannelInfoStruct & OpenChannelInfoExtra)
        };
    }

    async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
        const res = await this._session.request<MemberRes>(
            'MEMBER',
            {
                'chatId': this._channel.channelId,
                'memberIds': channelUsers.map(user => user.userId)
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };
        
        const result = (res.members as OpenMemberStruct[]).map(member => structToOpenChannelUserInfo(member));

        return { status: res.status, success: true, result };
    }
    
    async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
        const res = await this._session.request<GetMemRes>(
            'GETMEM',
            {
                'chatId': this._channel.channelId,
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };
        
        const result = (res.members as OpenMemberStruct[]).map(member => structToOpenChannelUserInfo(member));

        return { status: res.status, success: true, result };
    }

};

/**
 * Default ChannelManageSession implementation.
 */
export class TalkChannelManageSession implements ChannelManageSession {

    private _session: TalkSession;

    constructor(session: TalkSession) {
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
        if (res.chatRoom) result[1] = (structToNormalChannelInfo(res.chatRoom as ChannelInfoStruct & NormalChannelInfoExtra));

        return { status: res.status, success: true, result };
    }

    async createMemoChannel(): AsyncCommandResult<[Channel, NormalChannelInfo | null]> {
        const res = await this._session.request<CreateRes>('CREATE', { 'memoChat': true });
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };
        
        let result: [Channel, NormalChannelInfo | null] = [ { channelId: res.chatId }, null ];
        if (res.chatRoom) result[1] = (structToNormalChannelInfo(res.chatRoom as ChannelInfoStruct & NormalChannelInfoExtra));

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