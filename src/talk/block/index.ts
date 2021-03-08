/*
 * Created on Mon Feb 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncCommandResult, KnownDataStatusCode } from '../../request';
import { ChannelUser } from '../../user';
import { TalkSession } from '../client';

/**
 * Provide user block / unblock api.
 * Note: To get block list use web api.
 */
export class TalkBlockSession {
  constructor(private _session: TalkSession) {

  }

  /**
     * Block normal user
     *
     * @param {ChannelUser} user
     * @param {TalkBlockType} type
     */
  async blockUser(user: ChannelUser, type: TalkBlockType = TalkBlockType.BLOCK): AsyncCommandResult {
    const res = await this._session.request(
      'BLADDITEM',
      {
        'l': [user.userId],
        'ts': [type],
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status };
  }

  /**
     * Block plus user
     *
     * @param {ChannelUser} plusUser
     * @param {TalkBlockType} type
     */
  async blockPlusUser(plusUser: ChannelUser, type: TalkBlockType = TalkBlockType.BLOCK): AsyncCommandResult {
    const res = await this._session.request(
      'BLADDITEM',
      {
        'pl': [plusUser.userId],
        'pts': [type],
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status };
  }

  /**
     * Unblock normal user.
     *
     * @param {ChannelUser} user
     */
  async unblockUser(user: ChannelUser): Promise<{ success: boolean, status: number }> {
    const res = await this._session.request(
      'BLDELITEM',
      {
        'l': [user.userId],
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status };
  }

  /**
     * Unblock plus user.
     *
     * @param {ChannelUser} plusUser
     */
  async unblockPlusUser(plusUser: ChannelUser): Promise<{ success: boolean, status: number }> {
    const res = await this._session.request(
      'BLDELITEM',
      {
        'pl': [plusUser.userId],
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status };
  }
}

export enum TalkBlockType {

  BLOCK = 0,
  BLOCK_HIDE_PROFILE = 1

}
