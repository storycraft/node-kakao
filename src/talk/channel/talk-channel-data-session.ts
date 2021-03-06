/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelInfo, ChannelMeta, ChannelSession, SetChannelMeta, UpdatableChannelDataStore } from '../../channel';
import { ChannelMetaType } from '../../channel/meta';
import { Chat, Chatlog, ChatLogged, ChatType } from '../../chat';
import { MediaKeyComponent } from '../../media';
import { AsyncCommandResult, CommandResult } from '../../request';
import { ChannelUser, ChannelUserInfo } from '../../user';
import { MediaDownloader, MediaUploader, MediaUploadTemplate, MultiMediaUploader } from '../media';

export class TalkChannelDataSession implements ChannelSession {

  constructor(
    private _clientUser: ChannelUser,
    private _channelSession: ChannelSession,
    private _store: UpdatableChannelDataStore<ChannelInfo, ChannelUserInfo>
  ) {
    
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._clientUser;
  }

  get store(): UpdatableChannelDataStore<ChannelInfo, ChannelUserInfo> {
    return this._store;
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
      this._store.updateWatermark(this._clientUser.userId, chat.logId);
    }

    return res;
  }

  async setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta> {
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

  async setPushAlert(flag: boolean): AsyncCommandResult {
    const res = await this._channelSession.setPushAlert(flag);

    if (res.success) {
      this._store.updateInfo({ pushAlert: flag });
    }

    return res;
  }

  syncChatList(endLogId: Long, startLogId?: Long): AsyncIterableIterator<CommandResult<Chatlog[]>> {
    return this._channelSession.syncChatList(endLogId, startLogId);
  }

  getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]> {
    return this._channelSession.getChatListFrom(startLogId);
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

}