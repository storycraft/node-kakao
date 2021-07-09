/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatLogged, ChatLoggedType } from '../../chat';
import { TalkSession } from '../client';
import {
  OpenChannel,
  OpenChannelInfo,
  OpenChannelManageSession,
  OpenChannelSession,
  OpenChannelUserPerm,
  OpenLink,
  OpenLinkChannelUserInfo,
  OpenLinkComponent,
  OpenLinkKickedUserInfo,
  OpenLinkProfiles,
  OpenLinkProfile,
} from '../../openlink';
import { ChatInfoRes, ChatOnRoomRes, GetMemRes, MemberRes } from '../../packet/chat';
import { AsyncCommandResult, DefaultReq, KnownDataStatusCode } from '../../request';
import {
  ChannelInfoStruct,
  OpenChannelInfoExtra,
  OpenLinkChannelUserStruct,
  OpenMemberStruct,
  structToOpenChannelInfo,
  structToOpenChannelUserInfo,
  structToOpenLinkChannelUserInfo,
} from '../../packet/struct';
import { ChannelUser, OpenChannelUserInfo } from '../../user';
import { TalkOpenLinkSession } from './talk-open-link-session';
import { RelayEventType } from '../../relay';
import { Channel } from '../../channel';
import { TalkChannelManageSession, TalkNormalChannelSession } from '../channel';
import { JoinLinkRes } from '../../packet/chat/join-link';
import { Long } from 'bson';

/**
 * Default OpenChannelSession implementation.
 */

export class TalkOpenChannelSession implements OpenChannelSession {
  private _channel: OpenChannel;
  private _session: TalkSession;

  private _normalSession: TalkNormalChannelSession;
  private _linkSession: TalkOpenLinkSession;

  constructor(channel: OpenChannel, session: TalkSession) {
    this._channel = channel;
    this._session = session;

    this._normalSession = new TalkNormalChannelSession(channel, session);
    this._linkSession = new TalkOpenLinkSession(session);
  }

  get session(): TalkSession {
    return this._session;
  }
  
  chatON(): AsyncCommandResult<Readonly<ChatOnRoomRes>> {
    return this._normalSession.chatON();
  }

  async markRead(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
    const status = (await this._session.request(
      'NOTIREAD',
      {
        'chatId': this._channel.channelId,
        'li': this._channel.linkId,
        'watermark': chat.logId,
      },
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
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) {
      return { success: false, status: res.status };
    }

    return {
      success: true,
      status: res.status,
      result: structToOpenChannelInfo(res.chatInfo as ChannelInfoStruct & OpenChannelInfoExtra),
    };
  }

  async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
    const res = await this._session.request<MemberRes>(
      'MEMBER',
      {
        'chatId': this._channel.channelId,
        'memberIds': channelUsers.map((user) => user.userId),
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) {
      return { success: false, status: res.status };
    }

    const result = (res.members as OpenMemberStruct[]).map((member) => structToOpenChannelUserInfo(member));

    return { status: res.status, success: true, result };
  }

  async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
    const res = await this._session.request<GetMemRes>(
      'GETMEM',
      {
        'chatId': this._channel.channelId,
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) {
      return { success: false, status: res.status };
    }

    const result = (res.members as OpenMemberStruct[]).map((member) => structToOpenChannelUserInfo(member));

    return { status: res.status, success: true, result };
  }

  getKickList(): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._linkSession.getKickList(this._channel);
  }

  removeKicked(user: ChannelUser): AsyncCommandResult {
    return this._linkSession.removeKicked(this._channel, { ...user, kickedChannelId: this._channel.channelId });
  }

  react(flag: boolean): AsyncCommandResult {
    return this._linkSession.react(this._channel, flag);
  }

  getReaction(): AsyncCommandResult<[number, boolean]> {
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
        'mts': [perm],
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async createEvent(
    chat: ChatLoggedType,
    type: RelayEventType,
    count: number,
  ): AsyncCommandResult {
    const res = await this._session.request(
      'RELAYEVENT',
      {
        'c': this._channel.channelId,
        'li': this._channel.linkId,
        'et': type,
        'ec': count,
        'logId': chat.logId,
        't': chat.type,
      },
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
        'mts': [OpenChannelUserPerm.OWNER, OpenChannelUserPerm.NONE],
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async kickUser(user: ChannelUser): AsyncCommandResult {
    const res = await this._session.request(
      'KICKMEM',
      {
        'c': this._channel.channelId,
        'li': this._channel.linkId,
        'mid': user.userId,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async blockUser(user: ChannelUser): AsyncCommandResult {
    const res = await this._session.request(
      'BLIND',
      {
        'c': this._channel.channelId,
        'li': this._channel.linkId,
        'mid': user.userId,
        // Reporting user is not supported.
        'r': false,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async changeProfile(profile: OpenLinkProfiles): AsyncCommandResult<Readonly<OpenLinkChannelUserInfo> | null> {
    const res = await this._session.request(
      'UPLINKPROF',
      {
        'li': this._channel.linkId,
        ...OpenLinkProfile.serializeLinkProfile(profile),
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    if (res['olu']) {
      return {
        status: res.status,
        success: true,
        result: structToOpenLinkChannelUserInfo(res['olu'] as OpenLinkChannelUserStruct),
      };
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
        't': chat.type,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }
}

export class TalkOpenChannelManageSession implements OpenChannelManageSession {
  private _normalSession: TalkChannelManageSession;

  constructor(private _session: TalkSession) {
    this._normalSession = new TalkChannelManageSession(_session);
  }

  leaveChannel(channel: Channel): AsyncCommandResult<Long> {
    return this._normalSession.leaveChannel(channel);
  }

  async leaveKicked(channel: OpenChannel): AsyncCommandResult {
    const res = await this._session.request(
      'KICKLEAVE',
      {
        'c': channel.channelId,
        'li': channel.linkId,
      },
    );

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  async joinChannel(
    link: OpenLinkComponent,
    profile: OpenLinkProfiles,
    passcode?: string,
  ): AsyncCommandResult<OpenChannel> {
    let token: string | undefined;
    if (passcode) {
      const tokenRes = await this._session.request(
        'CHECKJOIN',
        {
          'li': link.linkId,
          'pc': passcode,
        },
      );

      if (tokenRes.status !== KnownDataStatusCode.SUCCESS) return { status: tokenRes.status, success: false };

      token = tokenRes['tk'] as string;
    }

    const reqData: DefaultReq = {
      'li': link.linkId,
      'ref': 'EW:',
      ...OpenLinkProfile.serializeLinkProfile(profile),
    };

    if (token) reqData['tk'] = token;

    const res = await this._session.request<JoinLinkRes>(
      'JOINLINK',
      reqData,
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

    return { status: res.status, success: true, result: { channelId: res.chatRoom.chatId, linkId: res.ol.li } };
  }
}
