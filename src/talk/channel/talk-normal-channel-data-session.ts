/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import {
  NormalChannelInfo,
  NormalChannelSession,
  UpdatableChannelDataStore
} from '../../channel';
import { ChatOnRoomRes } from '../../packet/chat';
import { NormalMemberStruct, structToChannelUserInfo } from '../../packet/struct';
import { AsyncCommandResult } from '../../request';
import { ChannelUser, NormalChannelUserInfo } from '../../user';
import { initNormalUserList, initWatermark } from './common';

/**
 * Do normal channel session operations and updates store.
 */
export class TalkNormalChannelDataSession implements NormalChannelSession {

  constructor(
    private _clientUser: ChannelUser,
    private _channelSession: NormalChannelSession,
    private _store: UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>
  ) {
    
  }
  
  get clientUser(): Readonly<ChannelUser> {
    return this._clientUser;
  }

  get store(): UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo> {
    return this._store;
  }

  async inviteUsers(users: ChannelUser[]): AsyncCommandResult {
    const res = await this._channelSession.inviteUsers(users);

    if (res.success) {
      await this.getLatestUserInfo(...users);
    }

    return res;
  }


  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._channelSession.chatON();

    if (res.success) {
      const { result } = res;

      if (this._store.info.type !== result.t || this._store.info.lastChatLogId !== result.l) {
        this._store.updateInfo({ type: result.t, lastChatLogId: result.l });
      }

      if (result.a && result.w) {
        this._store.clearWatermark();
        initWatermark(this._store, result.a, result.w);
      }

      if (result.m) {
        this._store.clearUserList();

        const structList = result.m as NormalMemberStruct[];

        for (const struct of structList) {
          const wrapped = structToChannelUserInfo(struct);
          this._store.updateUserInfo(wrapped, wrapped);
        }
      } else if (result.mi) {
        this._store.clearUserList();

        const userInitres = await initNormalUserList(this._channelSession, result.mi);
  
        if (!userInitres.success) return userInitres;
  
        for (const info of userInitres.result) {
          this._store.updateUserInfo(info, info);
        }

        const channelSession = this._channelSession;
        if (!this._store.getUserInfo(this._clientUser)) {
          const clientRes = await channelSession.getLatestUserInfo(this._clientUser);
          if (!clientRes.success) return clientRes;
  
          for (const user of clientRes.result) {
            this._store.updateUserInfo(user, user);
          }
        }
      }
    }

    return res;
  }

  async getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
    const infoRes = await this._channelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._store.setInfo(NormalChannelInfo.createPartial(infoRes.result));
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]> {
    const infoRes = await this._channelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as NormalChannelUserInfo[];

      this._store.clearUserList();
      result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]> {
    const infoRes = await this._channelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      this._store.clearUserList();
      infoRes.result.map((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

}
