/*
 * Created on Sat Mar 06 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { ChannelInfo, ChannelMeta, ChannelSession, SetChannelMeta, UpdatableChannelDataStore } from '../../channel';
import { ChannelMetaType } from '../../channel/meta';
import { Chat, Chatlog, ChatLogged, ChatType, DELETED_MESSAGE_OFFSET, UpdatableChatListStore } from '../../chat';
import { MediaKeyComponent } from '../../media';
import { AsyncCommandResult, CommandResult } from '../../request';
import { ChannelUser, ChannelUserInfo } from '../../user';
import { MediaDownloader, MediaUploader, MediaUploadTemplate, MultiMediaUploader } from '../media';
import { sendMultiMedia } from './common';

export class TalkChannelDataSession implements ChannelSession {

  constructor(
    private _clientUser: ChannelUser,
    private _channelSession: ChannelSession,
    private _store: UpdatableChannelDataStore<ChannelInfo, ChannelUserInfo>,
    private _chatListStore: UpdatableChatListStore
  ) {
    
  }

  get clientUser(): Readonly<ChannelUser> {
    return this._clientUser;
  }

  get store(): UpdatableChannelDataStore<ChannelInfo, ChannelUserInfo> {
    return this._store;
  }

  async sendChat(chat: string | Chat): AsyncCommandResult<Chatlog> {
    const res = await this._channelSession.sendChat(chat);

    if (res.success) {
      await this._chatListStore.addChat(res.result);
      this._store.updateInfo({ lastChatLogId: res.result.logId, lastChatLog: res.result });
    }

    return res;
  }

  async forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
    const res = await this._channelSession.forwardChat(chat);

    if (res.success) {
      await this._chatListStore.addChat(res.result);
      this._store.updateInfo({ lastChatLogId: res.result.logId, lastChatLog: res.result });
    }
    
    return res;
  }

  async deleteChat(chat: ChatLogged): AsyncCommandResult {
    const res = await this._channelSession.deleteChat(chat);

    if (res.success) {
      const deleted = await this._chatListStore.get(chat.logId);
      if (deleted) {
        await this._chatListStore.updateChat(chat.logId, {
          type: deleted.type | DELETED_MESSAGE_OFFSET
        });
      }
    }

    return res;
  }

  async markRead(chat: ChatLogged): AsyncCommandResult {
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
    const iterator = this._channelSession.syncChatList(endLogId, startLogId);

    return {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async () => {
        const next = await iterator.next();
        if (next.done || !next.value.success) return next;

        const res = next.value.result;

        this._chatListStore.addChat(...res);

        return next;
      }
    }
  }

  async getChatListFrom(startLogId?: Long): AsyncCommandResult<Chatlog[]> {
    const res = await this._channelSession.getChatListFrom(startLogId);

    if (res.success) {
      this._chatListStore.addChat(...res.result);
    }

    return res;
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

    const uploadRes = await res.result.upload();

    if (uploadRes.success) {
      await this._chatListStore.addChat(uploadRes.result);
      this._store.updateInfo({ lastChatLogId: uploadRes.result.logId, lastChatLog: uploadRes.result });
    }

    return uploadRes;
  }

  async sendMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<Chatlog> {
    const res = await sendMultiMedia(this, type, templates);

    if (res.success) {
      await this._chatListStore.addChat(res.result);
      this._store.updateInfo({ lastChatLogId: res.result.logId, lastChatLog: res.result });
    }

    return res;
  }

}
