/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatLogged, ChatLoggedType } from "../../chat/chat";
import { TalkSession } from "../client";
import { OpenChannel } from "../../openlink/open-channel";
import { OpenChannelInfo } from "../../openlink/open-channel-info";
import { OpenChannelManageSession, OpenChannelSession } from "../../openlink/open-channel-session";
import { OpenLink, OpenLinkProfiles } from "../../openlink";
import { OpenLinkChannelUserInfo, OpenLinkKickedUserInfo } from "../../openlink/open-link-user-info";
import { ChatInfoRes } from "../../packet/chat/chat-info";
import { GetMemRes } from "../../packet/chat/get-mem";
import { MemberRes } from "../../packet/chat/member";
import { KnownDataStatusCode } from "../../packet/status-code";
import { ChannelInfoStruct, OpenChannelInfoExtra } from "../../packet/struct/channel";
import { OpenMemberStruct } from "../../packet/struct/user";
import { structToOpenChannelInfo } from "../../packet/struct/wrap/channel";
import { structToOpenChannelUserInfo, structToOpenLinkChannelUserInfo } from "../../packet/struct/wrap/user";
import { AsyncCommandResult } from "../../request";
import { ChannelUser } from "../../user/channel-user";
import { OpenChannelUserInfo } from "../../user/channel-user-info";
import { TalkOpenLinkSession } from "./talk-openlink-session";
import { OpenChannelUserPerm } from "../../openlink/open-link-type";
import { RelayEventType } from "../../relay";
import { Long } from "bson";
import { Channel } from "../../channel";
import { TalkChannelManageSession } from "../channel";

/**
 * Default OpenChannelSession implementation.
 */

export class TalkOpenChannelSession implements OpenChannelSession {

    private _channel: OpenChannel;
    private _session: TalkSession;

    private _linkSession: TalkOpenLinkSession;

    constructor(channel: OpenChannel, session: TalkSession) {
        this._channel = channel;
        this._session = session;

        this._linkSession = new TalkOpenLinkSession(session);
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

        if (res.status !== KnownDataStatusCode.SUCCESS)
            return { success: false, status: res.status };

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

        if (res.status !== KnownDataStatusCode.SUCCESS)
            return { success: false, status: res.status };

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

        if (res.status !== KnownDataStatusCode.SUCCESS)
            return { success: false, status: res.status };

        const result = (res.members as OpenMemberStruct[]).map(member => structToOpenChannelUserInfo(member));

        return { status: res.status, success: true, result };
    }

    getKickList(): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
        return this._linkSession.getKickList(this._channel);
    }

    removeKicked(user: ChannelUser): AsyncCommandResult {
        return this._linkSession.removeKicked(this._channel, { ...user, kickedChannelId: this._channel.channelId });
    }

    react(flag: boolean) {
        return this._linkSession.react(this._channel, flag);
    }

    getReaction() {
        return this._linkSession.getReaction(this._channel);
    }

    async getLatestOpenLink(): AsyncCommandResult<OpenLink> {
        const res = await this._linkSession.getOpenLink(this._channel);

        if (res.success) {
            return { success: true, status: res.status, result: res.result[0] };
        } else {
            return res;
        }
    }

    async setUserPerm(user: ChannelUser, perm: OpenChannelUserPerm): AsyncCommandResult {
        const res = await this._session.request(
            'SETMEMTYPE',
            {
                'c': this._channel.channelId,
                'li': this._channel.linkId,
                'mids': [user.userId],
                'mts': [perm]
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    async createEvent(chat: ChatLoggedType, type: RelayEventType, count: number) {
        const res = await this._session.request(
            'RELAYEVENT',
            {
                'c': this._channel.channelId,
                'li': this._channel.linkId,
                'et': type,
                'ec': count,
                'logId': chat.logId,
                't': chat.type
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    async handoverHost(user: ChannelUser): AsyncCommandResult {
        const res = await this._session.request(
            'SETMEMTYPE',
            {
                'c': this._channel.channelId,
                'li': this._channel.linkId,
                'mids': [user.userId, this._session.clientUser.userId],
                'mts': [OpenChannelUserPerm.OWNER, OpenChannelUserPerm.NONE]
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    async kickUser(user: ChannelUser): AsyncCommandResult {
        const res = await this._session.request(
            'KICKMEM',
            {
                'c': this._channel.channelId,
                'li': this._channel.linkId,
                'mid': user.userId
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    async changeProfile(profile: OpenLinkProfiles): AsyncCommandResult<Readonly<OpenLinkChannelUserInfo> | null> {
        const res = await this._session.request(
            'UPLINKPROF',
            {
                'li': this._channel.linkId,
                ...OpenLinkProfiles.templateToSerialized(profile)
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        if (res['olu']) {
            return { status: res.status, success: true, result: structToOpenLinkChannelUserInfo(res['olu']) };
        }

        return { status: res.status, success: true, result: null };
    }

    async hideChat(chat: ChatLoggedType): AsyncCommandResult {
        const res = await this._session.request(
            'REWRITE',
            {
                'li': this._channel.linkId,
                'c': this._channel.channelId,
                'logId': chat.logId,
                't': chat.type
            }
        );
    
        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

}

export class TalkOpenChannelManageSession implements OpenChannelManageSession {

    private _normalSession: TalkChannelManageSession;

    constructor(private _session: TalkSession) {
        this._normalSession = new TalkChannelManageSession(_session);
    }

    leaveChannel(channel: Channel) {
        return this._normalSession.leaveChannel(channel);
    }

    async leaveKicked(channel: OpenChannel): AsyncCommandResult {
        const res = await this._session.request(
            'KICKLEAVE',
            {
                'c': channel.channelId,
                'li': channel.linkId
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

}