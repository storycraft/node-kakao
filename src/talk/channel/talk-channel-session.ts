/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import {
  Channel,
  ChannelMeta,
  ChannelSession,
  ChannelTemplate,
  NormalChannelInfo,
  NormalChannelManageSession,
  SetChannelMeta,
} from '../../channel';
import { Chat, Chatlog, ChatLogged, ChatType, KnownChatType } from '../../chat';
import { TalkSession } from '../client';
import { MediaKeyComponent } from '../../media';
import { AsyncCommandResult, CommandResult, DefaultReq, KnownDataStatusCode } from '../../request';
import {
  ChatInfoRes,
  ChatOnRoomRes,
  CreateRes,
  ForwardRes,
  GetMemRes,
  GetTrailerRes,
  MChatlogsRes,
  MemberRes,
  MShipRes,
  SetMetaRes,
  ShipRes,
  SyncMsgRes,
  WriteRes,
} from '../../packet/chat';
import {
  ChannelInfoStruct,
  NormalChannelInfoExtra,
  NormalMemberStruct,
  structToChannelUserInfo,
  structToChatlog,
  structToNormalChannelInfo,
} from '../../packet/struct';
import { ChannelUser, NormalChannelUserInfo } from '../../user';
import { JsonUtil } from '../../util';
import { MediaDownloader, MediaUploader, MultiMediaUploader } from '../media';
import * as NetSocket from '../../network/socket';
import { LocoSecureLayer } from '../../network';
import { newCryptoStore } from '../../crypto';
import { MediaUploadTemplate } from '../media/upload';
import { sha1 } from 'hash-wasm';
import { ChannelMetaType } from '../../channel/meta';

/**
 * Default ChannelSession implementation
 */
export class TalkChannelSession implements ChannelSession {
    private _channel: Channel;
    private _session: TalkSession;

    currentMsgId: number;

    constructor(channel: Channel, session: TalkSession) {
      this._channel = channel;
      this._session = session;

      this.currentMsgId = 0;
    }

    get session(): TalkSession {
      return this._session;
    }

    async sendChat(chat: Chat | string): AsyncCommandResult<Chatlog> {
      if (typeof chat === 'string') {
        chat = { type: KnownChatType.TEXT, text: chat } as Chat;
      }

      const data: DefaultReq = {
        'chatId': this._channel.channelId,
        'msgId': ++this.currentMsgId,
        'type': chat.type,
        'noSeen': true,
      };

      if (chat.text) {
        data['msg'] = chat.text;
      }

      if (chat.attachment) {
        data['extra'] = JsonUtil.stringifyLoseless(chat.attachment);
      }

      const res = await this._session.request<WriteRes>('WRITE', data);

      if (res.status === KnownDataStatusCode.SUCCESS) {
        let chatlog: Chatlog;
        if (res.chatLog) {
          chatlog = structToChatlog(res.chatLog);
        } else {
          chatlog = {
            ...chat,
            logId: res.logId,
            prevLogId: res.prevId,
            sendAt: res.sendAt,
            sender: this._session.clientUser,
            messageId: res.msgId,
          };
        }
        return { status: res.status, success: true, result: chatlog };
      } else {
        return { status: res.status, success: false };
      }
    }

    async forwardChat(chat: Chat): AsyncCommandResult<Chatlog> {
      const data: DefaultReq = {
        'chatId': this._channel.channelId,
        'msgId': ++this.currentMsgId,
        'type': chat.type,
        'noSeen': true,
      };

      if (chat.text) {
        data['msg'] = chat.text;
      }

      if (chat.attachment) {
        data['extra'] = JsonUtil.stringifyLoseless(chat.attachment);
      }

      const res = await this._session.request<ForwardRes>('FORWARD', data);

      if (res.status === KnownDataStatusCode.SUCCESS) {
        return { success: true, status: res.status, result: structToChatlog(res.chatLog) };
      } else {
        return { success: false, status: res.status };
      }
    }

    async deleteChat(chat: ChatLogged): Promise<{success: boolean, status: number}> {
      const { status } = (await this._session.request(
          'DELETEMSG',
          {
            'chatId': this._channel.channelId,
            'logId': chat.logId,
          },
      ));

      return {
        success: status === KnownDataStatusCode.SUCCESS,
        status,
      };
    }

    async markRead(chat: ChatLogged): Promise<{success: boolean, status: number}> {
      const { status } = (await this._session.request(
          'NOTIREAD',
          {
            'chatId': this._channel.channelId,
            'watermark': chat.logId,
          },
      ));
      return {
        success: status === KnownDataStatusCode.SUCCESS,
        status,
      };
    }

    async setMeta(type: ChannelMetaType, meta: ChannelMeta | string): AsyncCommandResult<SetChannelMeta> {
      const res = await this._session.request<SetMetaRes>(
          'SETMETA',
          {
            'chatId': this._channel.channelId,
            'type': type,
            'content': typeof meta === 'string' ? meta : meta.content,
          },
      );
      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      return {
        success: true,
        status: res.status,
        result: { ...res.meta },
      };
    }

    async setPushAlert(flag: boolean): AsyncCommandResult {
      const { status } = await this._session.request(
          'UPDATECHAT',
          {
            'chatId': this._channel.channelId,
            'pushAlert': flag,
          },
      );

      return {
        success: status === KnownDataStatusCode.SUCCESS,
        status,
      };
    }

    async inviteUsers(users: ChannelUser[]): AsyncCommandResult {
      const { status } = await this._session.request(
          'ADDMEM',
          {
            'chatId': this._channel.channelId,
            'memberIds': users.map((user) => user.userId),
          },
      );

      return {
        success: status === KnownDataStatusCode.SUCCESS,
        status,
      };
    }

    async chatON(): AsyncCommandResult<ChatOnRoomRes> {
      const res = await this._session.request<ChatOnRoomRes>(
          'CHATONROOM',
          {
            'chatId': this._channel.channelId,
            'token': Long.ZERO,
            'opt': 0,
          },
      );
      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      return { success: true, status: res.status, result: res };
    }

    async getLatestChannelInfo(): AsyncCommandResult<NormalChannelInfo> {
      const res = await this._session.request<ChatInfoRes>(
          'CHATINFO',
          {
            'chatId': this._channel.channelId,
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      return {
        success: true,
        status: res.status,
        result: structToNormalChannelInfo(res.chatInfo as ChannelInfoStruct & NormalChannelInfoExtra),
      };
    }

    async getLatestUserInfo(...channelUsers: ChannelUser[]): AsyncCommandResult<NormalChannelUserInfo[]> {
      const res = await this._session.request<MemberRes>(
          'MEMBER',
          {
            'chatId': this._channel.channelId,
            'memberIds': channelUsers.map((user) => user.userId),
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      const result = (res.members as NormalMemberStruct[]).map((member) => structToChannelUserInfo(member));

      return { success: true, status: res.status, result };
    }

    async getAllLatestUserInfo(): AsyncCommandResult<NormalChannelUserInfo[]> {
      const res = await this._session.request<GetMemRes>(
          'GETMEM',
          {
            'chatId': this._channel.channelId,
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      const result = (res.members as NormalMemberStruct[]).map((member) => structToChannelUserInfo(member));

      return { success: true, status: res.status, result };
    }

    syncChatList(endLogId: Long, startLogId: Long = Long.ZERO): AsyncIterableIterator<CommandResult<Chatlog[]>> {
      let curLogId = startLogId;
      let done = false;

      return {
        [Symbol.asyncIterator]() {
          return this;
        },

        next: async () => {
          if (done) return { done: true, value: null };

          const res = await this._session.request<SyncMsgRes>(
              'SYNCMSG',
              {
                'chatId': this._channel.channelId,
                'cur': curLogId,
                // Unknown
                'cnt': 0,
                'max': endLogId,
              },
          );

          if (res.status !== KnownDataStatusCode.SUCCESS) {
            done = true;
            return { done: false, value: { status: res.status, success: false } };
          } else if (res.isOK) {
            done = true;
          }

          if (!res.chatLogs || res.chatLogs.length < 0 || curLogId.greaterThanOrEqual(endLogId)) {
            return { done: true, value: null };
          }

          const result = res.chatLogs.map(structToChatlog);
          curLogId = result[result.length - 1].logId;

          return { done: false, value: { status: res.status, success: true, result } };
        },
      };
    }

    async getChatListFrom(startLogId: Long = Long.ZERO): AsyncCommandResult<Chatlog[]> {
      const res = await this._session.request<MChatlogsRes>(
          'MCHATLOGS',
          {
            'chatIds': [this._channel.channelId],
            'sinces': [startLogId],
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      return { status: res.status, success: true, result: res.chatLogs.map(structToChatlog) };
    }

    async downloadMedia(media: MediaKeyComponent, type: ChatType): AsyncCommandResult<MediaDownloader> {
      const res = await this._session.request<GetTrailerRes>(
          'GETTRAILER',
          {
            'k': media.key,
            't': type,
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      const socket = new LocoSecureLayer(
          await NetSocket.createTCPSocket({ host: res.vh, port: res.p, keepAlive: true }),
          await newCryptoStore(this._session.configuration.locoPEMPublicKey));

      return {
        status: res.status,
        success: true,
        result: new MediaDownloader(socket, this._session, this._channel, media),
      };
    }

    async uploadMedia(type: ChatType, template: MediaUploadTemplate): AsyncCommandResult<MediaUploader> {
      const res = await this._session.request<ShipRes>(
          'SHIP',
          {
            'c': this._channel.channelId,
            't': type,
            's': Long.fromNumber(template.data.byteLength),
            'cs': await sha1(new Uint8Array(template.data)),
            'e': template.ext || '',
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      return {
        success: true,
        status: res.status,
        result: new MediaUploader(
            { key: res.k },
            type,
            template,
            this._session,
            this._channel,
            new LocoSecureLayer(
                await NetSocket.createTCPSocket({ host: res.vh, port: res.p, keepAlive: true }),
                await newCryptoStore(this._session.configuration.locoPEMPublicKey),
            ),
        ),
      };
    }

    async uploadMultiMedia(type: ChatType, templates: MediaUploadTemplate[]): AsyncCommandResult<MultiMediaUploader[]> {
      const res = await this._session.request<MShipRes>(
          'MSHIP',
          {
            'c': this._channel.channelId,
            't': type,
            'sl': templates.map((template) => template.data.byteLength),
            'csl': await Promise.all(templates.map((template) => sha1(new Uint8Array(template.data)))),
            'el': templates.map((template) => template.ext || ''),
          },
      );

      if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

      const len = res.kl.length;
      const list: MultiMediaUploader[] = [];
      for (let i = 0; i < len; i++) {
        const key = res.kl[i];
        list.push(
            new MultiMediaUploader(
                { key },
                type,
                templates[i],
                this._session,
                new LocoSecureLayer(
                    await NetSocket.createTCPSocket({ host: res.vhl[i], port: res.pl[i], keepAlive: true }),
                    await newCryptoStore(this._session.configuration.locoPEMPublicKey),
                ),
            ),
        );
      }

      return { success: true, status: res.status, result: list };
    }
}

/**
 * Default ChannelManageSession implementation.
 */
export class TalkChannelManageSession implements NormalChannelManageSession {
    private _session: TalkSession;

    constructor(session: TalkSession) {
      this._session = session;
    }

    async createChannel(template: ChannelTemplate): AsyncCommandResult<Channel> {
      const data: DefaultReq = {
        'memberIds': template.userList.map((user) => user.userId),
      };

      if (template.name) data['nickName'] = template.name;
      if (template.profileURL) data['profileImageUrl'] = template.profileURL;

      const res = await this._session.request<CreateRes>('CREATE', data);
      if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

      return { status: res.status, success: true, result: { channelId: res.chatId } };
    }

    async createMemoChannel(): AsyncCommandResult<Channel> {
      const res = await this._session.request<CreateRes>('CREATE', { 'memberIds': [], 'memoChat': true });
      if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

      return { status: res.status, success: true, result: { channelId: res.chatId } };
    }

    async leaveChannel(channel: Channel, block = false): AsyncCommandResult<Long> {
      const res = await this._session.request(
          'LEAVE',
          {
            'chatId': channel.channelId,
            'block': block,
          },
      );

      return {
        status: res.status,
        success: res.status === KnownDataStatusCode.SUCCESS,
        result: res['lastTokenId'] as Long,
      };
    }
}
