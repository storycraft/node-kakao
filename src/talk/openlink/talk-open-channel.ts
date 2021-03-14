/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelDataStore, ChannelMeta, SetChannelMeta, UpdatableChannelDataStore } from '../../channel';
import { Chat, Chatlog, ChatLogged, ChatLoggedType, ChatType, UpdatableChatListStore } from '../../chat';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import { MediaKeyComponent, MediaMultiPost, MediaPost, MediaUploadForm } from '../../media';
import {
  OpenChannel,
  OpenChannelInfo,
  OpenChannelSession,
  OpenChannelUserPerm, OpenLink, OpenLinkChannelUserInfo, OpenLinkKickedUserInfo,
  OpenLinkProfiles,
} from '../../openlink';
import { AsyncCommandResult, CommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import { RelayEventType } from '../../relay';
import { ChannelUser, OpenChannelUserInfo } from '../../user';
import {
  TalkChannel,
  TalkChannelHandler,
  TalkChannelSession,
  TalkChannelDataSession,
  sendMedia,
  sendMultiMedia
} from '../channel';
import { TalkOpenChannelSession } from './talk-open-channel-session';
import { OpenChannelEvents } from '../event';
import { Managed } from '../managed';
import { TalkOpenChannelHandler } from './talk-open-channel-handler';
import { JsonUtil } from '../../util';
import {
  BotMetaContent,
  ChannelMetaType,
  GroupMetaContent,
  KnownChannelMetaType,
  LiveTalkCountMetaContent,
  LiveTalkInfoMetaContent,
  PrivilegeMetaContent,
  ProfileMetaContent,
  TvLiveMetaContent,
  TvMetaContent,
} from '../../channel/meta';
import { ChatOnRoomRes } from '../../packet/chat';
import { MediaUploadTemplate } from '../media/upload';
import { TalkOpenChannelDataSession } from './talk-open-channel-data-session';
import { FixedReadStream } from '../../stream';

type TalkOpenChannelEvents = OpenChannelEvents<TalkOpenChannel, OpenChannelUserInfo>;

export class TalkOpenChannel
  extends TypedEmitter<TalkOpenChannelEvents>
  implements OpenChannel, ChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>,
  TalkChannel, OpenChannelSession, Managed<TalkOpenChannelEvents> {

  private _channelSession: TalkChannelDataSession;
  private _openChannelSession: TalkOpenChannelDataSession;

  private _handler: TalkChannelHandler<TalkOpenChannel>;
  private _openHandler: TalkOpenChannelHandler<TalkOpenChannel>;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    store: UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>,
    private _chatListStore: UpdatableChatListStore
  ) {
    super();

    this._channelSession = new TalkChannelDataSession(
      session.clientUser,
      new TalkChannelSession(this, session),
      store,
      _chatListStore
    );
    this._openChannelSession = new TalkOpenChannelDataSession(
      session.clientUser,
      new TalkOpenChannelSession(this, session),
      store
    );

    this._handler = new TalkChannelHandler(this, this, store, _chatListStore);
    this._openHandler = new TalkOpenChannelHandler(this, this._openChannelSession, this, store, _chatListStore);
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._openChannelSession.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get chatListStore(): UpdatableChatListStore {
    return this._chatListStore;
  }

  get store(): UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo> {
    return this._openChannelSession.store;
  }

  get linkId(): Long {
    return this.store.info.linkId;
  }

  get info(): Readonly<OpenChannelInfo> {
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
    return this.getName() || this.info.openLink?.linkName || '';
  }

  getUserInfo(user: ChannelUser): Readonly<OpenChannelUserInfo> | undefined {
    return this.store.getUserInfo(user);
  }

  getAllUserInfo(): IterableIterator<OpenChannelUserInfo> {
    return this.store.getAllUserInfo();
  }

  getReadCount(chat: ChatLogged): number {
    return this.store.getReadCount(chat);
  }

  getReaders(chat: ChatLogged): Readonly<OpenChannelUserInfo>[] {
    return this.store.getReaders(chat);
  }

  async sendChat(chat: string | Chat): AsyncCommandResult<Chatlog> {
    return await this._channelSession.sendChat(chat);
  }

  forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
    return this._channelSession.forwardChat(chat);
  }

  deleteChat(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
    return this._channelSession.deleteChat(chat);
  }

  async inviteUsers(): AsyncCommandResult {
    // Cannot invite users to open channel
    return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };
  }

  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>> {
    return this._channelSession.syncChatList(endLogId, startLogId);
  }

  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]> {
    return this._channelSession.getChatListFrom(startLogId);
  }

  markRead(chat: ChatLogged): AsyncCommandResult {
    return this._openChannelSession.markRead(chat);
  }

  setMeta(type: ChannelMetaType, meta: string | ChannelMeta): AsyncCommandResult<SetChannelMeta> {
    return this._channelSession.setMeta(type, meta);
  }

  setTitleMeta(title: string): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.TITLE, title);
  }

  setNoticeMeta(notice: string): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.NOTICE, notice);
  }

  /**
   * Set privileged settings.
   * Need to be owner of the channel to set.
   *
   * @param {PrivilegeMetaContent} content
   * @return {AsyncCommandResult<SetChannelMeta>}
   */
  setPrivilegeMeta(content: PrivilegeMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.PRIVILEGE, JsonUtil.stringifyLoseless(content));
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

  /**
   * Set bot meta
   *
   * @param {BotMetaContent} content
   * @return {AsyncCommandResult<SetChannelMeta>}
   */
  setBotMeta(content: BotMetaContent): AsyncCommandResult<SetChannelMeta> {
    return this.setMeta(KnownChannelMetaType.BOT, JsonUtil.stringifyLoseless(content));
  }

  setPushAlert(flag: boolean): AsyncCommandResult {
    return this._channelSession.setPushAlert(flag);
  }

  chatON(): AsyncCommandResult<ChatOnRoomRes> {
    return this._openChannelSession.chatON();
  }

  getLatestChannelInfo(): AsyncCommandResult<OpenChannelInfo> {
    return this._openChannelSession.getLatestChannelInfo();
  }

  getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
    return this._openChannelSession.getLatestUserInfo(...users);
  }

  getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
    return this._openChannelSession.getAllLatestUserInfo();
  }

  getLatestOpenLink(): AsyncCommandResult<OpenLink> {
    return this._openChannelSession.getLatestOpenLink();
  }

  createEvent(
    chat: ChatLoggedType,
    type: RelayEventType,
    count: number,
  ): AsyncCommandResult {
    return this._openChannelSession.createEvent(chat, type, count);
  }

  getKickList(): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._openChannelSession.getKickList();
  }

  removeKicked(user: ChannelUser): AsyncCommandResult {
    return this._openChannelSession.removeKicked(user);
  }

  setUserPerm(user: ChannelUser, perm: OpenChannelUserPerm): AsyncCommandResult {
    return this._openChannelSession.setUserPerm(user, perm);
  }

  handoverHost(user: ChannelUser): AsyncCommandResult {
    return this._openChannelSession.handoverHost(user);
  }

  kickUser(user: ChannelUser): AsyncCommandResult {
    return this._openChannelSession.kickUser(user);
  }

  blockUser(user: ChannelUser): AsyncCommandResult {
    return this._openChannelSession.blockUser(user);
  }

  react(flag: boolean): AsyncCommandResult {
    return this._openChannelSession.react(flag);
  }

  getReaction(): AsyncCommandResult<[number, boolean]> {
    return this._openChannelSession.getReaction();
  }

  changeProfile(profile: OpenLinkProfiles): AsyncCommandResult<Readonly<OpenLinkChannelUserInfo> | null> {
    return this._openChannelSession.changeProfile(profile);
  }

  hideChat(chat: ChatLoggedType): AsyncCommandResult {
    return this._openChannelSession.hideChat(chat);
  }

  downloadMedia(media: MediaKeyComponent, type: ChatType, offset?: number): AsyncCommandResult<FixedReadStream> {
    return this._channelSession.downloadMedia(media, type, offset);
  }

  downloadMediaThumb(media: MediaKeyComponent, type: ChatType, offset?: number): AsyncCommandResult<FixedReadStream> {
    return this._channelSession.downloadMediaThumb(media, type, offset);
  }

  uploadMedia(type: ChatType, form: MediaUploadForm): AsyncCommandResult<MediaPost> {
    return this._channelSession.uploadMedia(type, form);
  }

  uploadMultiMedia(type: ChatType, forms: MediaUploadForm[]): AsyncCommandResult<MediaMultiPost> {
    return this._channelSession.uploadMultiMedia(type, forms);
  }

  sendMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<Chatlog> {
    return sendMedia(this._channelSession, type, template);
  }

  sendMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<Chatlog> {
    return sendMultiMedia(this._channelSession, type, templates);
  }

  async updateAll(): AsyncCommandResult {
    const infoRes = await this.getLatestChannelInfo();
    if (!infoRes.success) return infoRes;

    const linkRes = await this.getLatestOpenLink();
    if (!linkRes.success) return linkRes;

    return this.chatON();
  }

  // Called when broadcast packets are recevied.
  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<TalkOpenChannelEvents>): void {
    this._handler.pushReceived(method, data, parentCtx);
    this._openHandler.pushReceived(method, data, parentCtx);
  }
}
