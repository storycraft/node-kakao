/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncCommandResult, CommandResult, DefaultRes } from '../../request';
import { Channel, ChannelMeta, NormalChannelInfo, SetChannelMeta } from '../../channel';
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
import { initWatermarkMap, initNormalUserList, sendMultiMedia } from './common';
import { MediaDownloader, MediaUploader, MultiMediaUploader } from '../media';

export class TalkNormalChannel extends TypedEmitter<ChannelEvents> implements TalkChannel, Managed<ChannelEvents> {
  private _info: NormalChannelInfo;

  private _channelSession: TalkChannelSession;
  private _handler: TalkChannelHandler;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    info: Partial<NormalChannelInfo> = {},
    private _userInfoMap: Map<string, NormalChannelUserInfo> = new Map(),
    private _watermarkMap: Map<string, Long> = new Map(),
  ) {
    super();

    this._channelSession = new TalkChannelSession(this, session);
    this._handler = new TalkChannelHandler(this, {
      updateInfo: (info) => this._info = { ...this._info, ...info },

      updateUserInfo: (user, info) => {
        const strId = user.userId.toString();

        if (!info) {
          this._userInfoMap.delete(strId);
        } else {
          const lastInfo = this._userInfoMap.get(strId);

          if (lastInfo) {
            this._userInfoMap.set(strId, { ...lastInfo, ...info });
          }
        }
      },

      addUsers: (...user) => this.getLatestUserInfo(...user),

      updateWatermark: (readerId, watermark) => this._watermarkMap.set(readerId.toString(), watermark),
    });

    this._info = NormalChannelInfo.createPartial(info);
  }


  get clientUser(): Readonly<ChannelUser> {
    return this._channelSession.session.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get info(): Readonly<NormalChannelInfo> {
    return this._info;
  }

  get userCount(): number {
    return this._userInfoMap.size;
  }

  getName(): string {
    const nameMeta = this._info.metaMap[KnownChannelMetaType.TITLE];
    return nameMeta && nameMeta.content || '';
  }

  getDisplayName(): string {
    return this.getName() || this._info.displayUserList.map((user) => user.nickname).join(', ');
  }

  getUserInfo(user: ChannelUser): Readonly<NormalChannelUserInfo> | undefined {
    return this._userInfoMap.get(user.userId.toString());
  }

  getAllUserInfo(): IterableIterator<NormalChannelUserInfo> {
    return this._userInfoMap.values();
  }

  getReadCount(chat: ChatLogged): number {
    let count = 0;

    if (this.userCount >= 100) return 0;

    for (const [strId] of this._userInfoMap) {
      const watermark = this._watermarkMap.get(strId);

      if (!watermark || watermark && watermark.greaterThanOrEqual(chat.logId)) count++;
    }

    return count;
  }

  getReaders(chat: ChatLogged): Readonly<NormalChannelUserInfo>[] {
    const list: NormalChannelUserInfo[] = [];

    if (this.userCount >= 100) return [];

    for (const [strId, userInfo] of this._userInfoMap) {
      const watermark = this._watermarkMap.get(strId);

      if (watermark && watermark.greaterThanOrEqual(chat.logId)) list.push(userInfo);
    }

    return list;
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
      this._watermarkMap.set(this.clientUser.userId.toString(), chat.logId);
    }

    return res;
  }

  async setMeta(type: ChannelMetaType, meta: ChannelMeta | string): Promise<CommandResult<SetChannelMeta>> {
    const res = await this._channelSession.setMeta(type, meta);

    if (res.success) {
      this._info.metaMap[type] = res.result;
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
      this._info = { ...this._info, pushAlert: flag };
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

      if (this._info.type !== result.t || this._info.lastChatLogId !== result.l) {
        this._info = { ...this._info, type: result.t, lastChatLogId: result.l };
      }

      if (result.a && result.w) {
        this._watermarkMap = initWatermarkMap(result.a, result.w);
      }

      const userInfoMap = new Map();
      if (result.m) {
        const structList = result.m as NormalMemberStruct[];

        for (const struct of structList) {
          const wrapped = structToChannelUserInfo(struct);
          userInfoMap.set(wrapped.userId.toString(), wrapped);
        }
      } else if (result.mi) {
        const userInitres = await initNormalUserList(this._channelSession, result.mi);
  
        if (!userInitres.success) return userInitres;
  
        for (const info of userInitres.result) {
          userInfoMap.set(info.userId.toString(), info);
        }

        const channelSession = this._channelSession;
        const clientUser = channelSession.session.clientUser;
        if (!userInfoMap.has(clientUser.userId.toString())) {
          const clientRes = await channelSession.getLatestUserInfo(clientUser);
          if (!clientRes.success) return clientRes;
  
          for (const user of clientRes.result) {
            userInfoMap.set(user.userId.toString(), user);
          }
        }
      }

      if (userInfoMap.size > 0) this._userInfoMap = userInfoMap;
    }

    return res;
  }

  async getLatestChannelInfo(): Promise<CommandResult<NormalChannelInfo>> {
    const infoRes = await this._channelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._info = NormalChannelInfo.createPartial(infoRes.result);
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): Promise<CommandResult<NormalChannelUserInfo[]>> {
    const infoRes = await this._channelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as NormalChannelUserInfo[];

      result.forEach((info) => this._userInfoMap.set(info.userId.toString(), info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): Promise<CommandResult<NormalChannelUserInfo[]>> {
    const infoRes = await this._channelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      const userInfoMap = new Map();
      infoRes.result.map((info) => userInfoMap.set(info.userId.toString(), info));

      this._userInfoMap = userInfoMap;
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
