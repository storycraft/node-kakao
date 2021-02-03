/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel } from '../../channel/channel';
import { ChannelMeta } from '../../channel/channel-info';
import { Chat, Chatlog, ChatLogged, ChatLoggedType } from '../../chat/chat';
import { ChatType } from '../../chat/chat-type';
import { TalkSession } from '../client';
import { EventContext } from '../../event/event-context';
import { MediaKeyComponent } from '../../media';
import { OpenChannel } from '../../openlink/open-channel';
import { OpenChannelInfo } from '../../openlink/open-channel-info';
import { OpenChannelSession } from '../../openlink/open-channel-session';
import { OpenChannelUserPerm } from '../../openlink/open-link-type';
import { CommandResultDone, DefaultRes } from '../../request';
import { KnownDataStatusCode } from '../../request';
import { ChannelMetaType, KnownChannelMetaType } from '../../packet/struct/channel';
import { OpenMemberStruct } from '../../packet/struct/user';
import { structToOpenChannelUserInfo, structToOpenLinkChannelUserInfo } from '../../packet/struct/wrap/user';
import { RelayEventType } from '../../relay';
import { AsyncCommandResult } from '../../request';
import { ChannelUser } from '../../user/channel-user';
import { OpenChannelUserInfo } from '../../user/channel-user-info';
import { TalkChannel } from '../channel';
import { TalkChannelHandler, ChannelInfoUpdater } from '../channel/talk-channel-handler';
import { TalkChannelSession } from '../channel/talk-channel-session';
import { TalkOpenChannelSession } from './talk-open-channel-session';
import { OpenChannelEvents } from '../event';
import { Managed } from '../managed';
import { TalkOpenChannelHandler } from './talk-open-channel-handler';
import { OpenLinkProfiles } from '../../openlink';
import { JsonUtil } from '../../util';
import { PrivilegeMetaContent, ProfileMetaContent, TvMetaContent, TvLiveMetaContent, LiveTalkCountMetaContent, GroupMetaContent, BotMetaContent } from '../../channel/meta';
import { TypedEmitter } from '../../event';
import { ChatOnRoomRes } from '../../packet/chat/chat-on-room';
import { MediaUploadTemplate } from '../media/upload';
import { sendMultiMedia } from '../channel/common';

export class TalkOpenChannel extends TypedEmitter<OpenChannelEvents> implements OpenChannel, TalkChannel, OpenChannelSession, Managed<OpenChannelEvents> {
    private _info: OpenChannelInfo;

    private _channelSession: TalkChannelSession;
    private _openChannelSession: TalkOpenChannelSession;

    private _handler: TalkChannelHandler;
    private _openHandler: TalkOpenChannelHandler;

    private _userInfoMap: Map<string, OpenChannelUserInfo>;
    private _watermarkMap: Map<string, Long>;

    constructor(private _channel: Channel, session: TalkSession, info: Partial<OpenChannelInfo> = {}) {
      super();

      this._info = OpenChannelInfo.createPartial(info);
      this._watermarkMap = new Map();

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

      this._userInfoMap = new Map();
    }

    get clientUser() {
      return this._channelSession.session.clientUser;
    }

    get channelId() {
      return this._channel.channelId;
    }

    get linkId() {
      return this._info.linkId;
    }

    get info(): Readonly<OpenChannelInfo> {
      return this._info;
    }

    get userCount() {
      return this._userInfoMap.size;
    }

    getName() {
      const nameMeta = this._info.metaMap[KnownChannelMetaType.TITLE];
      return nameMeta && nameMeta.content || '';
    }

    getDisplayName() {
      return this.getName() || this._info.openLink?.linkName || '';
    }

    getUserInfo(user: ChannelUser): Readonly<OpenChannelUserInfo> | undefined {
      return this._userInfoMap.get(user.userId.toString());
    }

    getAllUserInfo() {
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

    async sendChat(chat: string | Chat) {
      const res = await this._channelSession.sendChat(chat);

      return res;
    }

    forwardChat(chat: Chat) {
      return this._channelSession.forwardChat(chat);
    }

    deleteChat(chat: ChatLogged) {
      return this._channelSession.deleteChat(chat);
    }

    async inviteUsers(users: ChannelUser[]): AsyncCommandResult {
      // Cannot invite users to open channel
      return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };
    }

    syncChatList(endLogId: Long, startLogId?: Long) {
      return this._channelSession.syncChatList(endLogId, startLogId);
    }

    getChatListFrom(startLogId?: Long) {
      return this._channelSession.getChatListFrom(startLogId);
    }

    async markRead(chat: ChatLogged) {
      const res = await this._openChannelSession.markRead(chat);

      if (res.success) {
        this._watermarkMap.set(this.clientUser.userId.toString(), chat.logId);
      }

      return res;
    }

    async setMeta(type: ChannelMetaType, meta: string | ChannelMeta) {
      const res = await this._channelSession.setMeta(type, meta);

      if (res.success) {
        this._info.metaMap[type] = res.result;
      }

      return res;
    }

    async setTitleMeta(title: string) {
      return this.setMeta(KnownChannelMetaType.TITLE, title);
    }

    async setNoticeMeta(notice: string) {
      return this.setMeta(KnownChannelMetaType.NOTICE, notice);
    }

    /**
     * Set privileged settings.
     * Need to be owner of the channel to set.
     *
     * @param content
     */
    async setPrivilegeMeta(content: PrivilegeMetaContent) {
      return this.setMeta(KnownChannelMetaType.PRIVILEGE, JsonUtil.stringifyLoseless(content));
    }

    async setProfileMeta(content: ProfileMetaContent) {
      return this.setMeta(KnownChannelMetaType.PROFILE, JsonUtil.stringifyLoseless(content));
    }

    async setTvMeta(content: TvMetaContent) {
      return this.setMeta(KnownChannelMetaType.TV, JsonUtil.stringifyLoseless(content));
    }

    async setTvLiveMeta(content: TvLiveMetaContent) {
      return this.setMeta(KnownChannelMetaType.TV_LIVE, JsonUtil.stringifyLoseless(content));
    }

    async setLiveTalkCountMeta(content: LiveTalkCountMetaContent) {
      return this.setMeta(KnownChannelMetaType.LIVE_TALK_COUNT, JsonUtil.stringifyLoseless(content));
    }

    async setGroupMeta(content: GroupMetaContent) {
      return this.setMeta(KnownChannelMetaType.GROUP, JsonUtil.stringifyLoseless(content));
    }

    /**
     * Set bot meta
     *
     * @param content
     */
    async setBotMeta(content: BotMetaContent) {
      return this.setMeta(KnownChannelMetaType.BOT, JsonUtil.stringifyLoseless(content));
    }

    async setPushAlert(flag: boolean) {
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

        if (this._info.type !== result.t || this._info.lastChatLogId !== result.l || this._info.openToken !== result.otk) {
          const newInfo = { ...this._info, type: result.t, lastChatLogId: result.l };
          if (result.otk) {
            newInfo['openToken'] = result.otk;
          }
          this._info = newInfo;
        }

        if (result.a && result.w) {
          const watermarkMap = new Map();
          const userLen = result.a.length;
          for (let i = 0; i < userLen; i++) {
            const userId = result.a[i];
            const watermark = result.w[i];

            watermarkMap.set(userId.toString(), watermark);
          }
          this._watermarkMap = watermarkMap;
        }

        if (result.m) {
          const userInfoMap = new Map();

          const structList = result.m as OpenMemberStruct[];
          structList.forEach((struct) => {
            const wrapped = structToOpenChannelUserInfo(struct);

            userInfoMap.set(wrapped.userId.toString(), wrapped);
          });

          this._userInfoMap = userInfoMap;
        } else if (result.mi) {
          await this.getAllLatestUserInfo();
        }

        if (result.olu) {
          const wrapped = structToOpenLinkChannelUserInfo(result.olu);
          this._userInfoMap.set(wrapped.userId.toString(), wrapped);
        }
      }

      return res;
    }

    async getLatestChannelInfo() {
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

    async getLatestOpenLink() {
      const res = await this._openChannelSession.getLatestOpenLink();

      if (res.success) {
        this._info = { ...this._info, openLink: res.result };
      }

      return res;
    }

    createEvent(chat: ChatLoggedType, type: RelayEventType, count: number) {
      return this._openChannelSession.createEvent(chat, type, count);
    }

    getKickList() {
      return this._openChannelSession.getKickList();
    }

    removeKicked(user: ChannelUser) {
      return this._openChannelSession.removeKicked(user);
    }

    async setUserPerm(user: ChannelUser, perm: OpenChannelUserPerm) {
      const res = await this._openChannelSession.setUserPerm(user, perm);

      if (res.success) {
        const userInfo = this.getUserInfo(user);
        if (userInfo) {
          this._userInfoMap.set(userInfo.userId.toString(), { ...userInfo, perm: perm });
        }
      }

      return res;
    }

    async handoverHost(user: ChannelUser) {
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

    async kickUser(user: ChannelUser) {
      const res = await this._openChannelSession.kickUser(user);

      if (res.success) {
        const strId = user.userId.toString();
        this._userInfoMap.delete(strId);
        this._watermarkMap.delete(strId);
      }

      return res;
    }

    async blockUser(user: ChannelUser) {
      return this._openChannelSession.blockUser(user);
    }

    react(flag: boolean) {
      return this._openChannelSession.react(flag);
    }

    getReaction() {
      return this._openChannelSession.getReaction();
    }

    async changeProfile(profile: OpenLinkProfiles) {
      const res = await this._openChannelSession.changeProfile(profile);
      if (res.success && res.result) {
        const strId = this._channelSession.session.clientUser.userId.toString();
        this._userInfoMap.set(strId, res.result);
      }

      return res;
    }

    hideChat(chat: ChatLoggedType) {
      return this._openChannelSession.hideChat(chat);
    }

    downloadMedia(media: MediaKeyComponent, type: ChatType) {
      return this._channelSession.downloadMedia(media, type);
    }

    uploadMedia(type: ChatType, template: MediaUploadTemplate) {
      return this._channelSession.uploadMedia(type, template);
    }

    uploadMultiMedia(type: ChatType, templates: MediaUploadTemplate[]) {
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
    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelEvents>) {
      this._handler.pushReceived(method, data, parentCtx);
      this._openHandler.pushReceived(method, data, parentCtx);
    }
}
