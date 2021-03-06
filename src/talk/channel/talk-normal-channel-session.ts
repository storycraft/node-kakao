/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import {
  Channel,
  NormalChannelInfo,
  NormalChannelSession,
} from '../../channel';
import { TalkSession } from '../client';
import { AsyncCommandResult, KnownDataStatusCode } from '../../request';
import {
  ChatInfoRes,
  ChatOnRoomRes,
  GetMemRes,
  MemberRes,
} from '../../packet/chat';
import {
  ChannelInfoStruct,
  NormalChannelInfoExtra,
  NormalMemberStruct,
  structToChannelUserInfo,
  structToNormalChannelInfo,
} from '../../packet/struct';
import { ChannelUser, NormalChannelUserInfo } from '../../user';
import { Long } from 'bson';

/**
 * Default NormalChannelSession implementation
 */
export class TalkNormalChannelSession implements NormalChannelSession {
  private _channel: Channel;
  private _session: TalkSession;

  currentMsgId: number;

  constructor(channel: Channel, session: TalkSession) {
    this._channel = channel;
    this._session = session;

    this.currentMsgId = 0;
  }

  get session(): TalkSession {
    return this._session;
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._session.request<ChatOnRoomRes>(
      'CHATONROOM',
      {
        'chatId': this._channel.channelId,
        'token': Long.ZERO,
        'opt': Long.ZERO,
      },
    );
    if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

    return { success: true, status: res.status, result: res };
  }

  async inviteUsers(users: ChannelUser[]): AsyncCommandResult {
    const { status } = await this._session.request(
      'ADDMEM',
      {
        'chatId': this._channel.channelId,
        'memberIds': users.map((user) => user.userId),
      },
    );

    return {
      success: status === KnownDataStatusCode.SUCCESS,
      status,
    };
  }

  async getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
    const res = await this._session.request<ChatInfoRes>(
      'CHATINFO',
      {
        'chatId': this._channel.channelId,
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

    return {
      success: true,
      status: res.status,
      result: structToNormalChannelInfo(res.chatInfo as ChannelInfoStruct & NormalChannelInfoExtra),
    };
  }

  async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]> {
    const res = await this._session.request<MemberRes>(
      'MEMBER',
      {
        'chatId': this._channel.channelId,
        'memberIds': channelUsers.map((user) => user.userId),
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

    const result = (res.members as NormalMemberStruct[]).map((member) => structToChannelUserInfo(member));

    return { success: true, status: res.status, result };
  }

  async getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]> {
    const res = await this._session.request<GetMemRes>(
      'GETMEM',
      {
        'chatId': this._channel.channelId,
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

    const result = (res.members as NormalMemberStruct[]).map((member) => structToChannelUserInfo(member));

    return { success: true, status: res.status, result };
  }
}
