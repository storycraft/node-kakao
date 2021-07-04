/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { UpdatableChannelDataStore } from '../../channel';
import { ChatLogged, ChatLoggedType } from '../../chat';
import {
  OpenChannelInfo,
  OpenChannelSession,
  OpenChannelUserPerm,
  OpenLink,
  OpenLinkChannelUserInfo,
  OpenLinkKickedUserInfo,
  OpenLinkProfiles
} from '../../openlink';
import { ChatOnRoomRes } from '../../packet/chat';
import { OpenMemberStruct, structToOpenChannelUserInfo, structToOpenLinkChannelUserInfo } from '../../packet/struct';
import { RelayEventType } from '../../relay';
import { AsyncCommandResult } from '../../request';
import { ChannelUser, OpenChannelUserInfo } from '../../user';
import { initOpenUserList, initWatermark } from '../channel';

/**
 * Do open channel session operations and updates store.
 */
export class TalkOpenChannelDataSession implements OpenChannelSession {

  constructor(
    private _clientUser: ChannelUser,
    private _channelSession: OpenChannelSession,
    private _store: UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>
  ) {

  }

  get clientUser(): Readonly<ChannelUser> {
    return this._clientUser;
  }

  get store(): UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo> {
    return this._store;
  }

  async markRead(chat: ChatLogged): AsyncCommandResult {
    const res = await this._channelSession.markRead(chat);

    if (res.success) {
      this._store.updateWatermark(this._clientUser.userId, chat.logId);
    }

    return res;
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._channelSession.chatON();

    if (res.success) {
      const { result } = res;

      if (
        this.store.info.type !== result.t ||
        this.store.info.lastChatLogId !== result.l ||
        this.store.info.openToken !== result.otk
      ) {
        const newInfo: Partial<OpenChannelInfo> = { type: result.t, lastChatLogId: result.l };
        if (result.otk) {
          newInfo['openToken'] = result.otk;
        }
        
        this._store.updateInfo(newInfo);
      }

      if (result.a && result.w) {
        initWatermark(this._store, result.a, result.w);
      }
      
      if (result.m) {
        const structList = result.m as OpenMemberStruct[];
        
        this._store.clearUserList();
        for (const struct of structList) {
          const wrapped = structToOpenChannelUserInfo(struct);
          this._store.updateUserInfo(wrapped, wrapped);
        }
      } else if (result.mi) {
        const userInitres = await initOpenUserList(this._channelSession, result.mi);
  
        if (!userInitres.success) return userInitres;
  
        this._store.clearUserList();
        for (const info of userInitres.result) {
          this._store.updateUserInfo(info, info);
        }
      }

      if (result.olu) {
        const wrapped = structToOpenLinkChannelUserInfo(result.olu);
        this._store.updateUserInfo(wrapped, wrapped);
      }
      
      const openChannelSession = this._channelSession;
      if (!this._store.getUserInfo(this._clientUser)) {
        const clientRes = await openChannelSession.getLatestUserInfo(this._clientUser);
        if (!clientRes.success) return clientRes;

        for (const user of clientRes.result) {
          this._store.updateUserInfo(user, user);
        }
      }
    }

    return res;
  }

  async getLatestChannelInfo(): AsyncCommandResult<OpenChannelInfo> {
    const infoRes = await this._channelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._store.updateInfo(infoRes.result);
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._channelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as OpenChannelUserInfo[];

      result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._channelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      infoRes.result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getLatestOpenLink(): AsyncCommandResult<OpenLink> {
    const res = await this._channelSession.getLatestOpenLink();

    if (res.success) {
      this._store.updateInfo({ openLink: res.result });
    }

    return res;
  }

  createEvent(
    chat: ChatLoggedType,
    type: RelayEventType,
    count: number,
  ): AsyncCommandResult {
    return this._channelSession.createEvent(chat, type, count);
  }

  getKickList(): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._channelSession.getKickList();
  }

  removeKicked(user: ChannelUser): AsyncCommandResult {
    return this._channelSession.removeKicked(user);
  }

  async setUserPerm(user: ChannelUser, perm: OpenChannelUserPerm): AsyncCommandResult {
    const res = await this._channelSession.setUserPerm(user, perm);

    if (res.success) {
      const userInfo = this._store.getUserInfo(user);
      if (userInfo) {
        this._store.updateUserInfo(userInfo, { ...userInfo, perm: perm });
      }
    }

    return res;
  }

  async handoverHost(user: ChannelUser): AsyncCommandResult {
    const res = await this._channelSession.handoverHost(user);

    if (res.success) {
      const openlinkRes = await this.getLatestOpenLink();
      if (openlinkRes.success) {
        this._store.updateInfo({ openLink: openlinkRes.result });
      }

      await this.getLatestUserInfo(user, this._clientUser);
    }

    return res;
  }

  async kickUser(user: ChannelUser): AsyncCommandResult {
    const res = await this._channelSession.kickUser(user);

    if (res.success) {
      this._store.removeUser(user);
    }

    return res;
  }

  async blockUser(user: ChannelUser): AsyncCommandResult {
    return this._channelSession.blockUser(user);
  }

  react(flag: boolean): AsyncCommandResult {
    return this._channelSession.react(flag);
  }

  getReaction(): AsyncCommandResult<[number, boolean]> {
    return this._channelSession.getReaction();
  }

  async changeProfile(profile: OpenLinkProfiles): AsyncCommandResult<Readonly<OpenLinkChannelUserInfo> | null> {
    const res = await this._channelSession.changeProfile(profile);
    if (res.success && res.result) {
      this._store.updateUserInfo(this._clientUser, res.result);
    }

    return res;
  }

  hideChat(chat: ChatLoggedType): AsyncCommandResult {
    return this._channelSession.hideChat(chat);
  }

}
