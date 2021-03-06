/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelDataStore, ChannelMeta, SetChannelMeta, UpdatableChannelDataStore } from '../../channel';
import { Chat, Chatlog, ChatLogged, ChatLoggedType, ChatType } from '../../chat';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import { MediaKeyComponent } from '../../media';
import {
  OpenChannel,
  OpenChannelInfo,
  OpenChannelSession,
  OpenChannelUserPerm, OpenLink, OpenLinkChannelUserInfo, OpenLinkKickedUserInfo,
  OpenLinkProfiles,
} from '../../openlink';
import { AsyncCommandResult, CommandResult, DefaultRes, KnownDataStatusCode } from '../../request';
import {
  OpenMemberStruct,
  structToOpenChannelUserInfo,
  structToOpenLinkChannelUserInfo,
} from '../../packet/struct';
import { RelayEventType } from '../../relay';
import { ChannelUser, OpenChannelUserInfo } from '../../user';
import {
  initOpenUserList,
  initWatermark,
  sendMultiMedia,
  TalkChannel,
  TalkChannelHandler,
  TalkChannelSession
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
import { MediaDownloader, MediaUploader, MultiMediaUploader } from '../media';
import { MediaUploadTemplate } from '../media/upload';

type TalkOpenChannelEvents = OpenChannelEvents<TalkOpenChannel, OpenChannelUserInfo>;

export class TalkOpenChannel
  extends TypedEmitter<TalkOpenChannelEvents>
  implements OpenChannel, ChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>,
  TalkChannel, OpenChannelSession, Managed<TalkOpenChannelEvents> {

  private _channelSession: TalkChannelSession;
  private _openChannelSession: TalkOpenChannelSession;

  private _handler: TalkChannelHandler<TalkOpenChannel>;
  private _openHandler: TalkOpenChannelHandler<TalkOpenChannel, OpenChannelUserInfo>;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    private _store: UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>
  ) {
    super();

    this._channelSession = new TalkChannelSession(this, session);
    this._openChannelSession = new TalkOpenChannelSession(this, session);

    this._handler = new TalkChannelHandler(this, this._channelSession, this, this._store, this._store);
    this._openHandler = new TalkOpenChannelHandler(this, this._openChannelSession, this, this._store, this._store);
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._channelSession.session.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get linkId(): Long {
    return this._store.info.linkId;
  }

  get info(): Readonly<OpenChannelInfo> {
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
    return this.getName() || this.info.openLink?.linkName || '';
  }

  getUserInfo(user: ChannelUser): Readonly<OpenChannelUserInfo> | undefined {
    return this._store.getUserInfo(user);
  }

  getAllUserInfo(): IterableIterator<OpenChannelUserInfo> {
    return this._store.getAllUserInfo();
  }

  getReadCount(chat: ChatLogged): number {
    return this._store.getReadCount(chat);
  }

  getReaders(chat: ChatLogged): Readonly<OpenChannelUserInfo>[] {
    return this._store.getReaders(chat);
  }

  async sendChat(chat: string | Chat): Promise<CommandResult<Chatlog>> {
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

  async markRead(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
    const res = await this._openChannelSession.markRead(chat);

    if (res.success) {
      this._store.updateWatermark(this.clientUser.userId, chat.logId);
    }

    return res;
  }

  async setMeta(type: ChannelMetaType, meta: string | ChannelMeta): Promise<CommandResult<SetChannelMeta>> {
    const res = await this._channelSession.setMeta(type, meta);

    if (res.success) {
      this._store.updateInfo({
        metaMap: {
          ...this._store.info.metaMap,
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

  /**
   * Set privileged settings.
   * Need to be owner of the channel to set.
   *
   * @param {PrivilegeMetaContent} content
   */
  async setPrivilegeMeta(content: PrivilegeMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.PRIVILEGE, JsonUtil.stringifyLoseless(content));
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

  /**
   * Set bot meta
   *
   * @param {BotMetaContent} content
   */
  async setBotMeta(content: BotMetaContent): Promise<CommandResult<SetChannelMeta>> {
    return this.setMeta(KnownChannelMetaType.BOT, JsonUtil.stringifyLoseless(content));
  }

  async setPushAlert(flag: boolean): Promise<CommandResult<void>> {
    const res = await this._channelSession.setPushAlert(flag);

    if (res.success) {
      this._store.updateInfo({ pushAlert: flag });
    }

    return res;
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._channelSession.chatON();

    if (res.success) {
      const { result } = res;

      if (
        this.info.type !== result.t ||
        this.info.lastChatLogId !== result.l ||
        this.info.openToken !== result.otk
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
        const userInitres = await initOpenUserList(this._openChannelSession, result.mi);
  
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
      
      const openChannelSession = this._openChannelSession;
      const clientUser = openChannelSession.session.clientUser;
      if (!this._store.getUserInfo(clientUser)) {
        const clientRes = await openChannelSession.getLatestUserInfo(clientUser);
        if (!clientRes.success) return clientRes;

        for (const user of clientRes.result) {
          this._store.updateUserInfo(user, user);
        }
      }
    }

    return res;
  }

  async getLatestChannelInfo(): Promise<CommandResult<OpenChannelInfo>> {
    const infoRes = await this._openChannelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._store.updateInfo(infoRes.result);
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._openChannelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as OpenChannelUserInfo[];

      this._store.clearUserList();
      result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._openChannelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      this._store.clearUserList();
      infoRes.result.forEach((info) => this._store.updateUserInfo(info, info));
    }

    return infoRes;
  }

  async getLatestOpenLink(): Promise<CommandResult<OpenLink>> {
    const res = await this._openChannelSession.getLatestOpenLink();

    if (res.success) {
      this._store.updateInfo({ openLink: res.result });
    }

    return res;
  }

  createEvent(
    chat: ChatLoggedType,
    type: RelayEventType,
    count: number,
  ): Promise<{ status: number, success: boolean }> {
    return this._openChannelSession.createEvent(chat, type, count);
  }

  getKickList(): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
    return this._openChannelSession.getKickList();
  }

  removeKicked(user: ChannelUser): AsyncCommandResult {
    return this._openChannelSession.removeKicked(user);
  }

  async setUserPerm(user: ChannelUser, perm: OpenChannelUserPerm): Promise<CommandResult> {
    const res = await this._openChannelSession.setUserPerm(user, perm);

    if (res.success) {
      const userInfo = this.getUserInfo(user);
      if (userInfo) {
        this._store.updateUserInfo(userInfo, { ...userInfo, perm: perm });
      }
    }

    return res;
  }

  async handoverHost(user: ChannelUser): Promise<CommandResult> {
    const res = await this._openChannelSession.handoverHost(user);

    if (res.success) {
      const openlinkRes = await this.getLatestOpenLink();
      if (openlinkRes.success) {
        this._store.updateInfo({ openLink: openlinkRes.result });
      }

      await this.getLatestUserInfo(user, this._channelSession.session.clientUser);
    }

    return res;
  }

  async kickUser(user: ChannelUser): Promise<CommandResult> {
    const res = await this._openChannelSession.kickUser(user);

    if (res.success) {
      this._store.removeUser(user);
    }

    return res;
  }

  async blockUser(user: ChannelUser): Promise<CommandResult> {
    return this._openChannelSession.blockUser(user);
  }

  react(flag: boolean): Promise<{ status: number, success: boolean }> {
    return this._openChannelSession.react(flag);
  }

  getReaction(): AsyncCommandResult<[number, boolean]> {
    return this._openChannelSession.getReaction();
  }

  async changeProfile(profile: OpenLinkProfiles): Promise<CommandResult<Readonly<OpenLinkChannelUserInfo> | null>> {
    const res = await this._openChannelSession.changeProfile(profile);
    if (res.success && res.result) {
      this._store.updateUserInfo(this.clientUser, res.result);
    }

    return res;
  }

  hideChat(chat: ChatLoggedType): AsyncCommandResult {
    return this._openChannelSession.hideChat(chat);
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
