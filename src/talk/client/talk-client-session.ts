/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LoginData, NormalChannelData } from '../../channel';
import { TalkSession } from './index';
import { ClientStatus } from '../../client-status';
import { ClientSession, LoginResult } from '../../client';
import { OAuthCredential } from '../../oauth';
import { OpenChannelData } from '../../openlink';
import { LChatListRes, LoginListRes } from '../../packet/chat';
import { AsyncCommandResult, DefaultReq, DefaultRes, KnownDataStatusCode } from '../../request';
import { ClientConfig } from '../../config';
import { dataStructToNormalChannelInfo, dataStructToOpenChannelInfo } from '../../packet/struct'
import { Long } from 'bson';

export class TalkClientSession implements ClientSession {
  private _lastLoginRev: number;

  constructor(private _session: TalkSession, public configuration: ClientConfig) {
    this._lastLoginRev = 0;
  }

  get session(): TalkSession {
    return this._session;
  }


  async login(credential: OAuthCredential): AsyncCommandResult<LoginResult> {
    const config = this.configuration;

    const req: DefaultReq = {
      'appVer': config.appVersion,
      'prtVer': '1',
      'os': config.agent,
      'lang': config.language,
      'duuid': credential.deviceUUID,
      'oauthToken': credential.accessToken,
      'dtype': config.deviceType,
      'ntype': config.netType,
      'MCCMNC': config.mccmnc,
      'revision': this._lastLoginRev,
      'chatIds': [],
      'maxIds': [],
      'lastTokenId': Long.ZERO,
      'lbk': 0,
      'rp': null,
      'bg': false,
    };

    const loginRes = await this._session.request<LoginListRes>('LOGINLIST', req);
    if (loginRes.status !== KnownDataStatusCode.SUCCESS) return { status: loginRes.status, success: false };

    let status = loginRes.status;
    const chatDataList = loginRes.chatDatas;
    const delChannelIdList = loginRes.delChatIds;

    this._lastLoginRev = loginRes.revision;

    let lastRes: LChatListRes = loginRes;
    while (!lastRes.eof) {
      const res = await this._session.request<LChatListRes>('LCHATLIST', {
        'lastTokenId': lastRes.lastTokenId,
        'lastChatId': lastRes.lastChatId
      });

      if (loginRes.status !== KnownDataStatusCode.SUCCESS) {
        status = KnownDataStatusCode.LOGINLIST_CHATLIST_FAILED;
        break;
      }

      chatDataList.push(...res.chatDatas);
      delChannelIdList.push(...res.delChatIds);

      lastRes = res;
    }

    const channelList: LoginData<NormalChannelData | OpenChannelData>[] = [];
    for (const channelData of chatDataList) {
      let channel: (NormalChannelData | OpenChannelData);

      if (channelData.li) {
        channel = {
          channelId: channelData.c,
          linkId: channelData.li,
          info: dataStructToOpenChannelInfo(channelData)
        };
      } else {
        channel = {
          channelId: channelData.c,
          info: dataStructToNormalChannelInfo(channelData)
        };
      }

      channelList.push({
        lastUpdate: channelData.o,
        channel
      });
    }

    return {
      status,
      success: true,
      result: {
        channelList,
        lastChannelId: lastRes.lastChatId,
        lastTokenId: lastRes.lastTokenId,
        mcmRevision: lastRes.mcmRevision,
        revision: loginRes.revision,
        revisionInfo: loginRes.revisionInfo,
        removedChannelIdList: delChannelIdList,
        minLogId: loginRes.minLogId,
        userId: loginRes.userId,
      },
    };
  }

  async setStatus(status: ClientStatus): AsyncCommandResult {
    const res = await this._session.request<LoginListRes>('SETST', { st: status });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
  }

  /**
   * Unknown
   *
   * @param {number[]} unknown
   * @return {AsyncCommandResult<DefaultRes>}
   */
  async getTokens(unknown: number[]): AsyncCommandResult<DefaultRes> {
    const res = await this._session.request('GETTOKEN', { ts: unknown });

    return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS, result: res };
  }
}
