/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncCommandResult, CommandResult, DefaultRes } from '../../request';
import {
  Channel,
  ChannelDataStore,
  ChannelMeta,
  NormalChannelInfo,
  SetChannelMeta,
  UpdatableChannelDataStore
} from '../../channel';
import { ChannelUser, NormalChannelUserInfo } from '../../user';
import { Chat, Chatlog, ChatLogged, ChatType } from '../../chat';
import { TalkChannelSession } from './talk-channel-session';
import {
  NormalMemberStruct,
  structToChannelUserInfo,
} from '../../packet/struct';
import { Managed } from '../managed';
import { EventContext, TypedEmitter } from '../../event';
import { TalkChannelHandler } from './talk-channel-handler';
import { Long } from 'bson';
import { TalkSession } from '../client';
import { MediaKeyComponent } from '../../media';
import { ChannelEvents } from '../event';
import { TalkChannel } from '.';
import {
  ChannelMetaType,
  GroupMetaContent,
  KnownChannelMetaType,
  LiveTalkCountMetaContent,
  LiveTalkInfoMetaContent,
  ProfileMetaContent,
  TvLiveMetaContent,
  TvMetaContent,
} from '../../channel/meta';
import { JsonUtil } from '../../util';
import { ChatOnRoomRes } from '../../packet/chat';
import { MediaUploadTemplate } from '../media/upload';
import { initWatermark, initNormalUserList, sendMultiMedia } from './common';
import { MediaDownloader, MediaUploader, MultiMediaUploader } from '../media';

export class TalkNormalChannel extends TypedEmitter<ChannelEvents>
  implements TalkChannel, ChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>, Managed<ChannelEvents> {

  private _channelSession: TalkChannelSession;
  private _handler: TalkChannelHandler;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    private _store: UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>
  ) {
    super();

    this._channelSession = new TalkChannelSession(this, session);
    this._handler = new TalkChannelHandler(this, this._store);
  }


  get clientUser(): Readonly<ChannelUser> {
    return this._channelSession.session.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get info(): Readonly<NormalChannelInfo> {
    return this._store.info;
  }

  get userCount(): number {
    return this._store.userCount;
  }

  getName(): string {
    const nameMeta = this.info.metaMap[KnownChannelMetaType.TITLE];
    return nameMeta && nameMeta.content || '';
  }

  getDisplayName(): string {
    return this.getName() || this.info.displayUserList.map((user) => user.nickname).join(', ');
  }

  getUserInfo(user: ChannelUser): Readonly<NormalChannelUserInfo> | undefined {
    return this._store.getUserInfo(user);
  }

  getAllUserInfo(): IterableIterator<NormalChannelUserInfo> {
    return this._store.getAllUserInfo();
  }

  getReadCount(chat: ChatLogged): number {
    return this._store.getReadCount(chat);
  }

  getReaders(chat: ChatLogged): Readonly<NormalChannelUserInfo>[] {
    return this._store.getReaders(chat);
  }

  sendChat(chat: string | Chat): AsyncCommandResult<Chatlog> {
    return this._channelSession.sendChat(chat);
  }

  forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
    return this._channelSession.forwardChat(chat);
  }

  deleteChat(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
    return this._channelSession.deleteChat(chat);
  }

  async markRead(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
    const res = await this._channelSession.markRead(chat);

    if (res.success) {
      this._store.updateWatermark(this.clientUser.userId, chat.logId);
    }

    return res;
  }

  async setMeta(type: ChannelMetaType, meta: ChannelMeta | string): Promise<CommandResult<SetChannelMeta>> {
    const res = await this._channelSession.setMeta(type, meta);

    if (res.success) {
      const lastInfoMap = this._store.info?.metaMap;
      this._store.updateInfo({
        metaMap: {
          ...lastInfoMap,
          [type]: res.result
        }
      });
    }

    return res;
  }

  async setTitleMeta(title: string): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.TITLE, title);
  }

  async setNoticeMeta(notice: string): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.NOTICE, notice);
  }

  async setProfileMeta(content: ProfileMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.PROFILE, JsonUtil.stringifyLoseless(content));
  }

  async setTvMeta(content: TvMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.TV, JsonUtil.stringifyLoseless(content));
  }

  async setTvLiveMeta(content: TvLiveMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.TV_LIVE, JsonUtil.stringifyLoseless(content));
  }

  async setLiveTalkInfoMeta(content: LiveTalkInfoMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.LIVE_TALK_INFO, JsonUtil.stringifyLoseless(content));
  }

  async setLiveTalkCountMeta(content: LiveTalkCountMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.LIVE_TALK_COUNT, JsonUtil.stringifyLoseless(content));
  }

  async setGroupMeta(content: GroupMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.GROUP, JsonUtil.stringifyLoseless(content));
  }

  async setPushAlert(flag: boolean): Promise<CommandResult> {
    const res = await this._channelSession.setPushAlert(flag);

    if (res.success) {
      this._store.updateInfo({ pushAlert: flag });
    }

    return res;
  }

  async inviteUsers(users: ChannelUser[]): Promise<CommandResult> {
    const res = await this._channelSession.inviteUsers(users);

    if (res.success) {
      await this.getLatestUserInfo(...users);
    }

    return res;
  }

  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>> {
    return this._channelSession.syncChatList(endLogId, startLogId);
  }

  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]> {
    return this._channelSession.getChatListFrom(startLogId);
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._channelSession.chatON();

    if (res.success) {
      const { result } = res;

      if (this.info.type !== result.t || this.info.lastChatLogId !== result.l) {
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
        const clientUser = channelSession.session.clientUser;
        if (!this._store.getUserInfo(clientUser)) {
          const clientRes = await channelSession.getLatestUserInfo(clientUser);
          if (!clientRes.success) return clientRes;
  
          for (const user of clientRes.result) {
            this._store.updateUserInfo(user, user);
          }
        }
      }
    }

    return res;
  }

  async getLatestChannelInfo(): Promise<CommandResult<NormalChannelInfo>> {
    const infoRes = await this._channelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._store.setInfo(NormalChannelInfo.createPartial(infoRes.result));
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): Promise<CommandResult<NormalChannelUserInfo[]>> {
    const infoRes = await this._channelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as NormalChannelUserInfo[];

      this._store.clearUserList();
      result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): Promise<CommandResult<NormalChannelUserInfo[]>> {
    const infoRes = await this._channelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      this._store.clearUserList();
      infoRes.result.map((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  downloadMedia(media: MediaKeyComponent, type: ChatType): AsyncCommandResult<MediaDownloader> {
    return this._channelSession.downloadMedia(media, type);
  }

  uploadMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<MediaUploader> {
    return this._channelSession.uploadMedia(type, template);
  }

  uploadMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<MultiMediaUploader[]> {
    return this._channelSession.uploadMultiMedia(type, templates);
  }

  async sendMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<Chatlog> {
    const res = await this._channelSession.uploadMedia(type, template);
    if (!res.success) return res;

    return res.result.upload();
  }

  async sendMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<Chatlog> {
    return sendMultiMedia(this._channelSession, type, templates);
  }

  async updateAll(): AsyncCommandResult {
    const infoRes = await this.getLatestChannelInfo();
    if (!infoRes.success) return infoRes;

    return this.chatON();
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>): void {
    this._handler.pushReceived(method, data, parentCtx);
  }
}
