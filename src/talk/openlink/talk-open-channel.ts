/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelMeta, SetChannelMeta } from '../../channel';
import { Chat, Chatlog, ChatLogged, ChatLoggedType, ChatType } from '../../chat';
import { TalkSession } from '../client';
import { EventContext, TypedEmitter } from '../../event';
import { MediaKeyComponent } from '../../media';
import {
  OpenChannel,
  OpenChannelData,
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
  ChannelInfoUpdater,
  initWatermarkMap,
  initOpenUserList,
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

export class TalkOpenChannel
  extends TypedEmitter<OpenChannelEvents>
  implements OpenChannel, OpenChannelData, TalkChannel, OpenChannelSession, Managed<OpenChannelEvents> {
  private _info: OpenChannelInfo;

  private _channelSession: TalkChannelSession;
  private _openChannelSession: TalkOpenChannelSession;

  private _handler: TalkChannelHandler;
  private _openHandler: TalkOpenChannelHandler;

  constructor(
    private _channel: Channel,
    session: TalkSession,
    info: Partial<OpenChannelInfo> = {},
    private _userInfoMap: Map<string, OpenChannelUserInfo> = new Map(),
    private _watermarkMap: Map<string, Long> = new Map(),
  ) {
    super();

    this._info = OpenChannelInfo.createPartial(info);
    this._channelSession = new TalkChannelSession(this, session);
    this._openChannelSession = new TalkOpenChannelSession(this, session);

    const infoUpdater: ChannelInfoUpdater<OpenChannelInfo, OpenChannelUserInfo> = {
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
    };

    this._handler = new TalkChannelHandler(this, infoUpdater);
    this._openHandler = new TalkOpenChannelHandler(this, infoUpdater);
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._channelSession.session.clientUser;
  }

  get channelId(): Long {
    return this._channel.channelId;
  }

  get linkId(): Long {
    return this._info.linkId;
  }

  get info(): Readonly<OpenChannelInfo> {
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
    return this.getName() || this._info.openLink?.linkName || '';
  }

  getUserInfo(user: ChannelUser): Readonly<OpenChannelUserInfo> | undefined {
    return this._userInfoMap.get(user.userId.toString());
  }

  getAllUserInfo(): IterableIterator<OpenChannelUserInfo> {
    return this._userInfoMap.values();
  }

  getReadCount(chat: ChatLogged): number {
    let count = 0;
    for (const watermark of this._watermarkMap.values()) {
      if (watermark.greaterThanOrEqual(chat.logId)) count++;
    }

    return count;
  }

  getReaders(chat: ChatLogged): Readonly<OpenChannelUserInfo>[] {
    const list: Readonly<OpenChannelUserInfo>[] = [];

    for (const [strId, userInfo] of this._userInfoMap) {
      const watermark = this._watermarkMap.get(strId);

      if (watermark && watermark.greaterThanOrEqual(chat.logId)) list.push(userInfo);
    }

    return list;
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
      this._watermarkMap.set(this.clientUser.userId.toString(), chat.logId);
    }

    return res;
  }

  async setMeta(type: ChannelMetaType, meta: string | ChannelMeta): Promise<CommandResult<SetChannelMeta>> {
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
      this._info = { ...this._info, pushAlert: flag };
    }

    return res;
  }

  async chatON(): AsyncCommandResult<ChatOnRoomRes> {
    const res = await this._channelSession.chatON();

    if (res.success) {
      const { result } = res;

      if (
        this._info.type !== result.t ||
        this._info.lastChatLogId !== result.l ||
        this._info.openToken !== result.otk
      ) {
        const newInfo = { ...this._info, type: result.t, lastChatLogId: result.l };
        if (result.otk) {
          newInfo['openToken'] = result.otk;
        }
        this._info = newInfo;
      }

      if (result.a && result.w) {
        this._watermarkMap = initWatermarkMap(result.a, result.w);
      }
      
      const userInfoMap = new Map();
      if (result.m) {
        const structList = result.m as OpenMemberStruct[];
        
        for (const struct of structList) {
          const wrapped = structToOpenChannelUserInfo(struct);
          userInfoMap.set(wrapped.userId.toString(), wrapped);
        }
      } else if (result.mi) {
        const userInitres = await initOpenUserList(this._openChannelSession, result.mi);
  
        if (!userInitres.success) return userInitres;
  
        for (const info of userInitres.result) {
          userInfoMap.set(info.userId.toString(), info);
        }
      }

      if (result.olu) {
        const wrapped = structToOpenLinkChannelUserInfo(result.olu);
        userInfoMap.set(wrapped.userId.toString(), wrapped);
      }
      
      const openChannelSession = this._openChannelSession;
      const clientUser = openChannelSession.session.clientUser;
      if (!userInfoMap.has(clientUser.userId.toString())) {
        const clientRes = await openChannelSession.getLatestUserInfo(clientUser);
        if (!clientRes.success) return clientRes;

        for (const user of clientRes.result) {
          userInfoMap.set(user.userId.toString(), user);
        }
      }
      
      if (userInfoMap.size > 0) this._userInfoMap = userInfoMap;
    }

    return res;
  }

  async getLatestChannelInfo(): Promise<CommandResult<OpenChannelInfo>> {
    const infoRes = await this._openChannelSession.getLatestChannelInfo();

    if (infoRes.success) {
      this._info = { ...this._info, ...infoRes.result };
    }

    return infoRes;
  }

  async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._openChannelSession.getLatestUserInfo(...users);

    if (infoRes.success) {
      const result = infoRes.result as OpenChannelUserInfo[];

      result.forEach((info) => this._userInfoMap.set(info.userId.toString(), info));
    }

    return infoRes;
  }

  async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
    const infoRes = await this._openChannelSession.getAllLatestUserInfo();

    if (infoRes.success) {
      const userInfoMap = new Map();
      infoRes.result.map((info) => userInfoMap.set(info.userId.toString(), info));

      this._userInfoMap = userInfoMap;
    }

    return infoRes;
  }

  async getLatestOpenLink(): Promise<CommandResult<OpenLink>> {
    const res = await this._openChannelSession.getLatestOpenLink();

    if (res.success) {
      this._info = { ...this._info, openLink: res.result };
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
        this._userInfoMap.set(userInfo.userId.toString(), { ...userInfo, perm: perm });
      }
    }

    return res;
  }

  async handoverHost(user: ChannelUser): Promise<CommandResult> {
    const res = await this._openChannelSession.handoverHost(user);

    if (res.success) {
      const openlinkRes = await this.getLatestOpenLink();
      if (openlinkRes.success) {
        this._info = { ...this._info, openLink: openlinkRes.result };
      }

      await this.getLatestUserInfo(user, this._channelSession.session.clientUser);
    }

    return res;
  }

  async kickUser(user: ChannelUser): Promise<CommandResult> {
    const res = await this._openChannelSession.kickUser(user);

    if (res.success) {
      const strId = user.userId.toString();
      this._userInfoMap.delete(strId);
      this._watermarkMap.delete(strId);
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
      const strId = this._channelSession.session.clientUser.userId.toString();
      this._userInfoMap.set(strId, res.result);
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
  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelEvents>): void {
    this._handler.pushReceived(method, data, parentCtx);
    this._openHandler.pushReceived(method, data, parentCtx);
  }
}
