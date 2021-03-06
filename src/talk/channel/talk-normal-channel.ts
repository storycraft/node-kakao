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
import { TalkNormalChannelSession } from './talk-normal-channel-session';
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
import { sendMultiMedia } from './common';
import { MediaDownloader, MediaUploader, MultiMediaUploader } from '../media';
import { TalkNormalChannelDataSession } from './talk-normal-channel-data-session';
import { TalkChannelDataSession } from './talk-channel-data-session';
import { TalkChannelSession } from './talk-channel-session';
import { TalkNormalChannelHandler } from './talk-normal-channel-handler';

type TalkChannelEvents = ChannelEvents<TalkNormalChannel, NormalChannelUserInfo>;

export class TalkNormalChannel extends TypedEmitter<TalkChannelEvents>
  implements TalkChannel,
  ChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>,
  Managed<TalkChannelEvents> {

  private _channelSession: TalkChannelDataSession;
  private _normalChannelSession: TalkNormalChannelDataSession;

  private _normalHandler: TalkNormalChannelHandler<TalkNormalChannel>;
  private _handler: TalkChannelHandler<TalkNormalChannel>;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    store: UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>
  ) {
    super();

    this._channelSession = new TalkChannelDataSession(
      session.clientUser,
      new TalkChannelSession(this, session),
      store
    );
    this._normalChannelSession = new TalkNormalChannelDataSession(
      session.clientUser,
      new TalkNormalChannelSession(this, session),
      store
    );

    this._handler = new TalkChannelHandler(this, this, store);
    this._normalHandler = new TalkNormalChannelHandler(this, this._normalChannelSession, this, store);
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._normalChannelSession.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get store(): UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo> {
    return this._normalChannelSession.store;
  }

  get info(): Readonly<NormalChannelInfo> {
    return this.store.info;
  }

  get userCount(): number {
    return this.store.userCount;
  }

  getName(): string {
    const nameMeta = this.info.metaMap[KnownChannelMetaType.TITLE];
    return nameMeta && nameMeta.content || '';
  }

  getDisplayName(): string {
    return this.getName() || this.info.displayUserList.map((user) => user.nickname).join(', ');
  }

  getUserInfo(user: ChannelUser): Readonly<NormalChannelUserInfo> | undefined {
    return this._normalChannelSession.store.getUserInfo(user);
  }

  getAllUserInfo(): IterableIterator<NormalChannelUserInfo> {
    return this._normalChannelSession.store.getAllUserInfo();
  }

  getReadCount(chat: ChatLogged): number {
    return this.store.getReadCount(chat);
  }

  getReaders(chat: ChatLogged): Readonly<NormalChannelUserInfo>[] {
    return this.store.getReaders(chat);
  }

  sendChat(chat: string | Chat): AsyncCommandResult<Chatlog> {
    return this._channelSession.sendChat(chat);
  }

  forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
    return this._channelSession.forwardChat(chat);
  }

  deleteChat(chat: ChatLogged): AsyncCommandResult {
    return this._channelSession.deleteChat(chat);
  }

  markRead(chat: ChatLogged): AsyncCommandResult {
    return this._channelSession.markRead(chat);
  }

  setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta> {
    return this._channelSession.setMeta(type, meta);
  }

  setTitleMeta(title: string): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.TITLE, title);
  }

  setNoticeMeta(notice: string): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.NOTICE, notice);
  }

  setProfileMeta(content: ProfileMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.PROFILE, JsonUtil.stringifyLoseless(content));
  }

  setTvMeta(content: TvMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.TV, JsonUtil.stringifyLoseless(content));
  }

  setTvLiveMeta(content: TvLiveMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.TV_LIVE, JsonUtil.stringifyLoseless(content));
  }

  setLiveTalkInfoMeta(content: LiveTalkInfoMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.LIVE_TALK_INFO, JsonUtil.stringifyLoseless(content));
  }

  setLiveTalkCountMeta(content: LiveTalkCountMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.LIVE_TALK_COUNT, JsonUtil.stringifyLoseless(content));
  }

  setGroupMeta(content: GroupMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.GROUP, JsonUtil.stringifyLoseless(content));
  }

  setPushAlert(flag: boolean): AsyncCommandResult {
    return this._channelSession.setPushAlert(flag);
  }

  inviteUsers(users: ChannelUser[]): AsyncCommandResult {
    return this._normalChannelSession.inviteUsers(users);
  }

  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>> {
    return this._channelSession.syncChatList(endLogId, startLogId);
  }

  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]> {
    return this._channelSession.getChatListFrom(startLogId);
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    return this._normalChannelSession.chatON();
  }

  async getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
    return this._normalChannelSession.getLatestChannelInfo();
  }

  async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]> {
    return this._normalChannelSession.getLatestUserInfo(...users);
  }

  async getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]> {
    return this._normalChannelSession.getAllLatestUserInfo();
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

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<TalkChannelEvents>): void {
    this._handler.pushReceived(method, data, parentCtx);
    this._normalHandler.pushReceived(method, data, parentCtx);
  }
}
