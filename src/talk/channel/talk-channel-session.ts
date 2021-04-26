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
  NormalChannelManageSession,
  SetChannelMeta,
} from '../../channel';
import { Chat, Chatlog, ChatLogged, ChatType, KnownChatType } from '../../chat';
import { TalkSession } from '../client';
import { AsyncCommandResult, CommandResult, DefaultReq, KnownDataStatusCode } from '../../request';
import {
  CreateRes,
  ForwardRes,
  GetTrailerRes,
  MChatlogsRes,
  MShipRes,
  SetMetaRes,
  ShipRes,
  SyncMsgRes,
  WriteRes,
} from '../../packet/chat';
import { ChatlogStruct, structToChatlog } from '../../packet/struct';
import { ChannelUser } from '../../user';
import { JsonUtil } from '../../util';
import { ChannelMetaType } from '../../channel/meta';
import { MediaKeyComponent, MediaMultiPost, MediaMultiPostEntry, MediaPost, MediaUploadForm } from '../../media';
import { ConnectionSession, LocoSecureLayer, LocoSession } from '../../network';
import { FixedReadStream, FixedWriteStream } from '../../stream';
import { newCryptoStore } from '../../crypto';
import * as NetSocket from '../../network/socket';

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

  async sendChat(chat: Chat | string, noSeen = true): AsyncCommandResult<Chatlog> {
    if (typeof chat === 'string') {
      chat = { type: KnownChatType.TEXT, text: chat } as Chat;
    }

    const data: DefaultReq = {
      'chatId': this._channel.channelId,
      'msgId': ++this.currentMsgId,
      'type': chat.type,
      'noSeen': noSeen,
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

  async forwardChat(chat: Chat, noSeen = true): AsyncCommandResult<Chatlog> {
    const data: DefaultReq = {
      'chatId': this._channel.channelId,
      'msgId': ++this.currentMsgId,
      'type': chat.type,
      'noSeen': noSeen,
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

  async deleteChat(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
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

  async markRead(chat: ChatLogged): Promise<{ success: boolean, status: number }> {
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

  async createTrailerSession(media: MediaKeyComponent, type: ChatType): AsyncCommandResult<ConnectionSession> {
    const res = await this._session.request<GetTrailerRes>(
      'GETTRAILER',
      {
        'k': media.key,
        't': type,
      },
    );

    if (res.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: res.status };

    return {
      success: true,
      status: res.status,
      result: new LocoSession(
        new LocoSecureLayer(
          await NetSocket.createTCPSocket({ host: res.vh, port: res.p, keepAlive: true }),
          await newCryptoStore(this._session.configuration.locoPEMPublicKey)
        )
      )
    };
  }

  async downloadMedia(media: MediaKeyComponent, type: ChatType, offset = 0): AsyncCommandResult<FixedReadStream> {
    const res = await this.createTrailerSession(media, type);
    if (!res.success) return res;

    const session = res.result;
    const clientConfig = this._session.configuration;

    const data = await session.request('DOWN', {
      'k': media.key,
      'c': this._channel.channelId,
      'o': offset,
      'rt': true,

      'u': this._session.clientUser.userId,
      'os': clientConfig.agent,
      'av': clientConfig.appVersion,
      'nt': clientConfig.netType,
      'mm': clientConfig.mccmnc,
    });
    
    const size = data['s'] as number;

    return {
      status: KnownDataStatusCode.SUCCESS,
      success: true,
      result: new FixedReadStream(session.stream, size),
    };
  }

  async downloadMediaThumb(media: MediaKeyComponent, type: ChatType, offset = 0): AsyncCommandResult<FixedReadStream> {
    const res = await this.createTrailerSession(media, type);
    if (!res.success) return res;

    const session = res.result;
    const clientConfig = this._session.configuration;

    const data = await session.request('MINI', {
      'k': media.key,
      'c': this._channel.channelId,
      'o': offset,

      // These should be actual dimension of media.
      // Seems like server doesn't care about it.
      'w': 0,
      'h': 0,

      'u': this._session.clientUser.userId,
      'os': clientConfig.agent,
      'av': clientConfig.appVersion,
      'nt': clientConfig.netType,
      'mm': clientConfig.mccmnc,
    });

    const size = data['s'] as number;

    return {
      status: KnownDataStatusCode.SUCCESS,
      success: true,
      result: new FixedReadStream(session.stream, size),
    };
  }

  async shipMedia(type: ChatType, form: MediaUploadForm): AsyncCommandResult<ShipRes> {
    const res = await this._session.request<ShipRes>(
      'SHIP',
      {
        'c': this._channel.channelId,
        't': type,
        's': form.size,
        'cs': form.checksum,
        'e': form.metadata.ext || '',
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status, result: res };
  }

  async shipMultiMedia(type: ChatType, forms: MediaUploadForm[]): AsyncCommandResult<MShipRes> {
    const res = await this._session.request<MShipRes>(
      'MSHIP',
      {
        'c': this._channel.channelId,
        't': type,
        'sl': forms.map((form) => form.size),
        'csl': forms.map((form) => form.checksum),
        'el': forms.map((form) => form.metadata.ext || ''),
      },
    );

    return { success: res.status === KnownDataStatusCode.SUCCESS, status: res.status, result: res };
  }

  async uploadMedia(type: ChatType, form: MediaUploadForm): AsyncCommandResult<MediaPost> {
    const shipRes = await this.shipMedia(type, form);

    if (!shipRes.success) return shipRes;

    const mediaStream = new LocoSecureLayer(
      await NetSocket.createTCPSocket({ host: shipRes.result.vh, port: shipRes.result.p, keepAlive: true }),
      await newCryptoStore(this._session.configuration.locoPEMPublicKey),
    );
    const session = new LocoSession(mediaStream);
    
    const clientConfig = this._session.configuration;

    const reqData: DefaultReq = {
      'k': shipRes.result.k,
      's': form.size,
      'f': form.metadata.name,
      't': type,

      'c': this._channel.channelId,
      'mid': Long.ONE,
      'ns': true,

      'u': this._session.clientUser.userId,
      'os': clientConfig.agent,
      'av': clientConfig.appVersion,
      'nt': clientConfig.netType,
      'mm': clientConfig.mccmnc,
    };

    if (form.metadata.width) reqData['w'] = form.metadata.width;
    if (form.metadata.height) reqData['h'] = form.metadata.height;

    const postRes = await session.request('POST', reqData);
    const offset = postRes['o'] as number;

    return {
      status: shipRes.status,
      success: true,
      result: {
        stream: new FixedWriteStream(mediaStream, form.size),
        offset,

        async finish() {
          let result: CommandResult<Chatlog> = { status: KnownDataStatusCode.OPERATION_DENIED, success: false };
          for await (const { method, data } of session.listen()) {
            if (method === 'COMPLETE') {
              if (data.status === KnownDataStatusCode.SUCCESS) {
                const chatlog = structToChatlog(data['chatLog'] as ChatlogStruct);
                result = { status: data.status, success: true, result: chatlog };
              }

              break;
            }
          }

          if (!mediaStream.ended) mediaStream.close();

          return result;
        }
      }
    };
  }

  async uploadMultiMedia(type: ChatType, forms: MediaUploadForm[]): AsyncCommandResult<MediaMultiPost> {
    const shipRes = await this.shipMultiMedia(type, forms);

    if (!shipRes.success) return shipRes;

    const res = shipRes.result;

    const formIter = forms[Symbol.iterator]();
    let i = 0;

    const entryList: MediaMultiPostEntry[] = [];
    
    const clientConfig = this._session.configuration;

    const entries: AsyncIterableIterator<CommandResult<MediaMultiPostEntry>> = {
      [Symbol.asyncIterator]() {
        return this;
      },

      next: async (): Promise<IteratorResult<CommandResult<MediaMultiPostEntry>>> => {
        const nextForm = formIter.next();
        if (nextForm.done) return { done: true, value: null };
        const form = nextForm.value;

        const mediaStream = new LocoSecureLayer(
          await NetSocket.createTCPSocket({ host: res.vhl[i], port: res.pl[i], keepAlive: true }),
          await newCryptoStore(this._session.configuration.locoPEMPublicKey),
        );
        const session = new LocoSession(mediaStream);

        const postRes = await session.request('MPOST', {
          'k': res.kl[i],
          's': form.size,
          't': type,
  
          'u': this._session.clientUser.userId,
          'os': clientConfig.agent,
          'av': clientConfig.appVersion,
          'nt': clientConfig.netType,
          'mm': clientConfig.mccmnc,
        });

        const result = {
          offset: postRes['o'] as number,
          stream: new FixedWriteStream(mediaStream, form.size),

          async finish(): AsyncCommandResult {
            for await (const { method, data } of session.listen()) {
              if (method === 'COMPLETE') {
                mediaStream.close();
                return { status: data.status, success: data.status === KnownDataStatusCode.SUCCESS };
              }
            }
  
            if (!mediaStream.ended) mediaStream.close();

            return { status: KnownDataStatusCode.OPERATION_DENIED, success: false };
          }
        };

        i++;
        return {
          done: false,
          value: {
            status: postRes.status,
            success: true,
            result
          }
        }
      }
    };
    
    return {
      status: shipRes.status,
      success: true,
      result: {
        entries,

        finish: async () => {
          for (const entry of entryList) {
            if (!entry.stream.ended) entry.stream.close();
          }

          return this.forwardChat({
            text: '',
            type,
            attachment: {
              kl: res.kl,
              wl: forms.map((form) => form.metadata.width || 0),
              hl: forms.map((form) => form.metadata.height || 0),
              mtl: forms.map((form) => form.metadata.ext || ''),
              sl: forms.map((form) => form.size),
              imageUrls: [], thumbnailUrls: [],
              thumbnailWidths: [], thumbnailHeights: [],
            },
          });
        }
      }
    }
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
