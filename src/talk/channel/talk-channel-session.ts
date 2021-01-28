/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel } from "../../channel/channel";
import { ChannelMeta, NormalChannelInfo, SetChannelMeta } from "../../channel/channel-info";
import { NormalChannelManageSession, ChannelSession, ChannelTemplate } from "../../channel/channel-session";
import { Chat, Chatlog, ChatLogged, ChatLogLinked } from "../../chat/chat";
import { ChatType, KnownChatType } from "../../chat/chat-type";
import { TalkSession } from "../client";
import { MediaComponent } from "../../media";
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
import { ChannelInfoStruct, ChannelMetaType, NormalChannelInfoExtra } from "../../packet/struct/channel";
import { NormalMemberStruct } from "../../packet/struct/user";
import { structToNormalChannelInfo } from "../../packet/struct/wrap/channel";
import { structToChatlog } from "../../packet/struct/wrap/chat";
import { structToChannelUserInfo } from "../../packet/struct/wrap/user";
import { AsyncCommandResult, CommandResult } from "../../request";
import { ChannelUser, OpenChannelUser } from "../../user/channel-user";
import { NormalChannelUserInfo } from "../../user/channel-user-info";
import { JsonUtil } from "../../util/json-util";
import { MediaDownloader } from "../media/media-downloader";
import * as NetSocket from '../../network/socket';
import { GetTrailerRes } from "../../packet/chat/get-trailer";
import { LocoSecureLayer } from "../../network/loco-secure-layer";
import { newCryptoStore } from "../../crypto";
import { SyncMsgRes } from "../../packet/chat/sync-msg";

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
        const { status } = (await this._session.request(
            'DELETEMSG',
            {
                'chatId': this._channel.channelId,
                'logId': chat.logId
            }
        ));

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status
        };
    }

    async markRead(chat: ChatLogged) {
        const { status } = (await this._session.request(
            'NOTIREAD',
            {
                'chatId': this._channel.channelId,
                'watermark': chat.logId
            }
        ));
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

    async setPushAlert(flag: boolean): AsyncCommandResult {
        const { status } = await this._session.request(
            'UPDATECHAT',
            {
                'chatId': this._channel.channelId,
                'pushAlert': flag
            }
        );

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status
        };
    }

    async inviteUsers(users: ChannelUser[]): AsyncCommandResult {
        const { status } = await this._session.request(
            'ADDMEM',
            {
                'chatId': this._channel.channelId,
                'memberIds': users.map(user => user.userId)
            }
        );

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status
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

    async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]> {
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

    async getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]> {
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

    syncChatList(endLogId: Long, startLogId: Long = Long.ZERO): AsyncIterableIterator<CommandResult<Chatlog[]>> {
        let curLogId = startLogId;
        let done = false;

        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            next: async () => {
                if (done) return { done: true, value: null };

                const res = await this._session.request<SyncMsgRes>(
                    'SYNCMSG',
                    {
                        'chatId': this._channel.channelId,
                        'cur': curLogId,
                        // Unknown
                        'cnt': 0,
                        'max': endLogId
                    }
                );

                if (res.status !== KnownDataStatusCode.SUCCESS) {
                    done = true;
                    return { done: false, value: { status: res.status, success: false } };
                } else if (res.isOK) {
                    done = true;
                }

                if (!res.chatLogs || res.chatLogs.length < 0 || curLogId.greaterThanOrEqual(endLogId)) {
                    return { done: true, value: null };
                }

                const result = res.chatLogs.map(structToChatlog);
                curLogId = result[result.length - 1].logId;

                return { done: false, value: { status: KnownDataStatusCode.SUCCESS, success: true, result } };
            }
        };
    }

    async createMediaDownloader(media: MediaComponent, type: ChatType): AsyncCommandResult<MediaDownloader> {
        const res = await this._session.request<GetTrailerRes>(
            'GETTRAILER',
            {
                'k': media.key,
                't': type
            }
        );

        if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

        const socket = new LocoSecureLayer(
            await NetSocket.createTCPSocket({ host: res.vh, port: res.p, keepAlive: true }),
            await newCryptoStore(this._session.configuration.locoPEMPublicKey));

        return { status: res.status, success: true, result: new MediaDownloader(socket, this._session, this._channel, media) };
    }

}

/**
 * Default ChannelManageSession implementation.
 */
export class TalkChannelManageSession implements NormalChannelManageSession {

    private _session: TalkSession;

    constructor(session: TalkSession) {
        this._session = session;
    }

    async createChannel(template: ChannelTemplate): AsyncCommandResult<Channel> {
        const data: Record<string, any> = {
            'memberIds': template.userList.map(user => user.userId)
        };

        if (template.name) data['nickname'] = template.name;
        if (template.profileURL) data['profileImageUrl'] = template.profileURL;

        const res = await this._session.request<CreateRes>('CREATE', data);
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: { channelId: res.chatId } };
    }

    async createMemoChannel(): AsyncCommandResult<Channel> {
        const res = await this._session.request<CreateRes>('CREATE', { 'memoChat': true });
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: { channelId: res.chatId } };
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