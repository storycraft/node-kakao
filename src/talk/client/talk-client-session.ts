/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel } from '../../channel';
import { TalkSession } from './index';
import { ClientStatus } from '../../client-status';
import { ClientSession, LoginResult } from '../../client';
import { OAuthCredential } from '../../oauth';
import { OpenChannel } from '../../openlink';
import { LoginListRes } from '../../packet/chat';
import { AsyncCommandResult, CommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import { ClientConfig } from '../../config';

export class TalkClientSession implements ClientSession {
    private _lastLoginRev: number;
    private _lastTokenId: Long;
    private _lastBlockTk: number;

    constructor(private _session: TalkSession, public configuration: ClientConfig) {
      this._lastLoginRev = 0;

      this._lastTokenId = Long.ZERO;
      this._lastBlockTk = 0;
    }

    get session(): TalkSession {
      return this._session;
    }


    async login(credential: OAuthCredential): Promise<CommandResult<LoginResult>> {
      const config = this.configuration;

      const req: Record<string, any> = {
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
        'rp': null,
        'chatIds': [], // Long[]
        'maxIds': [], // Long[]
        'lastTokenId': this._lastTokenId,
        'lbk': this._lastBlockTk,
        'bg': false,
      };

      const loginRes = await this._session.request<LoginListRes>('LOGINLIST', req);
      if (loginRes.status !== KnownDataStatusCode.SUCCESS) return { status: loginRes.status, success: false };

      this._lastLoginRev = loginRes.revision;
      this._lastTokenId = loginRes.lastTokenId;
      this._lastBlockTk = loginRes.lbk;

      const channelList: (Channel | OpenChannel)[] = [];
      for (const channelData of loginRes.chatDatas) {
        let channel: (Channel | OpenChannel);
        if (channelData.li) {
          channel = { channelId: channelData.c, linkId: channelData.li };
        } else {
          channel = { channelId: channelData.c };
        }

        channelList.push(channel);
      }

      return {
        status: loginRes.status,
        success: true,
        result: {
          channelList: channelList,
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
