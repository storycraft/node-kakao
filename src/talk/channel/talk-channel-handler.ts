/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import {
  Channel,
  ChannelInfo,
  ChannelStore,
  SetChannelMeta,
  UpdatableChannelDataStore
} from '../../channel';
import {
  ChatFeed,
  DeleteAllFeed,
  DELETED_MESSAGE_OFFSET,
  FeedFragment,
  feedFromChat,
  KnownChatType,
  KnownFeedType,
  UpdatableChatListStore
} from '../../chat';
import { EventContext, TypedEmitter } from '../../event';
import { ChannelEvents, ChannelListEvent } from '../event';
import { ChgMetaRes, DecunreadRes, LeftRes, MsgRes } from '../../packet/chat';
import { ChatlogStruct, structToChatlog } from '../../packet/struct';
import { AsyncCommandResult, DefaultRes } from '../../request';
import { ChannelUserInfo } from '../../user';
import { Managed } from '../managed';
import { TalkChatData } from '../chat';

type TalkChannelHandlerEvents<T extends Channel> = ChannelEvents<T, ChannelUserInfo>;

/**
 * Capture and handle pushes coming to channel
 */
export class TalkChannelHandler<T extends Channel> implements Managed<TalkChannelHandlerEvents<T>> {

  constructor(
    private _channel: T,
    private _emitter: TypedEmitter<ChannelEvents<T, ChannelUserInfo>>,
    private _store: UpdatableChannelDataStore<ChannelInfo, ChannelUserInfo>,
    private _chatListStore: UpdatableChatListStore
  ) {

  }

  private get info() {
    return this._store.info;
  }

  private _callEvent<E extends keyof TalkChannelHandlerEvents<T>>(
    parentCtx: EventContext<TalkChannelHandlerEvents<T>>,
    event: E, ...args: Parameters<TalkChannelHandlerEvents<T>[E]>
  ) {
    this._emitter.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  private _msgHandler(msgData: DefaultRes & MsgRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    if (!this._channel.channelId.equals(msgData.chatId)) return;

    const chatLog = structToChatlog(msgData.chatLog);

    if (msgData.authorNickname) {
      const userInfo = this._store.getUserInfo(chatLog.sender);
      if (userInfo && userInfo.nickname !== msgData.authorNickname) {
        this._store.updateUserInfo(chatLog.sender, { nickname: msgData.authorNickname });
      }
    }

    this._callEvent(
      parentCtx,
      'chat',
      new TalkChatData(chatLog),
      this._channel,
    );

    this._chatListStore.addChat(chatLog).then(() => {
      this._store.updateInfo({
        lastChatLogId: msgData.logId,
        lastChatLog: chatLog,
      });
    });
  }

  private _feedHandler(data: DefaultRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    const channelId = data['c'] as Long;
    if (!this._channel.channelId.equals(channelId)) return;

    const chatLog = structToChatlog(data['chatLog'] as ChatlogStruct);
    this._callEvent(
      parentCtx,
      'chat',
      new TalkChatData(chatLog),
      this._channel,
    );

    this._chatListStore.addChat(chatLog).then(() => {
      this._store.updateInfo({
        lastChatLogId: chatLog.logId,
        lastChatLog: chatLog,
      });
    });
  }

  private _chatReadHandler(readData: DefaultRes & DecunreadRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    if (!this._channel.channelId.equals(readData.chatId)) return;

    const reader = this._store.getUserInfo({ userId: readData.userId });

    this._store.updateWatermark(readData.userId, readData.watermark);

    this._callEvent(
      parentCtx,
      'chat_read',
      { logId: readData.watermark },
      this._channel,
      reader,
    );
  }

  private _metaChangeHandler(metaData: DefaultRes & ChgMetaRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    if (!this._channel.channelId.equals(metaData.chatId)) return;

    const metaType = metaData.meta.type;
    const meta = metaData.meta as SetChannelMeta;

    this._callEvent(
      parentCtx,
      'meta_change',
      this._channel,
      metaType,
      meta,
    );

    const metaMap = { ...this.info.metaMap };
    metaMap[metaType] = meta;

    this._store.updateInfo({
      metaMap,
    });
  }

  private _userLeftHandler(data: DefaultRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    const struct = data['chatLog'] as ChatlogStruct | undefined;
    if (!struct || !this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);

    // TODO: The event should be called whatever the chat is valid or not.
    if (chatLog.type === KnownChatType.FEED) {
      const feed = feedFromChat(chatLog);

      if ('member' in feed) {
        const memberFeed = feed as ChatFeed & FeedFragment.Member;
  
        const user = this._store.getUserInfo(memberFeed.member);
    
        if (user) {
          this._store.removeUser(user);
  
          this._callEvent(
            parentCtx,
            'user_left',
            chatLog,
            this._channel,
            user,
            feed,
          );
        }
      }
    }

    this._chatListStore.addChat(chatLog).then();

    return;
  }

  private _msgDeleteHandler(data: DefaultRes, parentCtx: EventContext<TalkChannelHandlerEvents<T>>) {
    const struct = data['chatLog'] as ChatlogStruct;
    if (!this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);
    if (chatLog.type !== KnownChatType.FEED) return;
    const feed = feedFromChat(chatLog);
    if (feed.feedType !== KnownFeedType.DELETE_TO_ALL) return;

    const delAllFeed = feed as DeleteAllFeed;

    this._callEvent(
      parentCtx,
      'chat_deleted',
      chatLog,
      this._channel,
      delAllFeed,
    );

    this._chatListStore.addChat(chatLog).then(async () => {
      if (!delAllFeed.logId) return;

      const chat = await this._chatListStore.get(delAllFeed.logId);
      if (!chat) return;

      await this._chatListStore.updateChat(delAllFeed.logId, { type: chat.type | DELETED_MESSAGE_OFFSET });
    }).then();
  }

  async pushReceived(
    method: string,
    data: DefaultRes,
    parentCtx: EventContext<TalkChannelHandlerEvents<T>>
  ): Promise<void> {
    switch (method) {
      case 'MSG':
        await this._msgHandler(data as DefaultRes & MsgRes, parentCtx);
        break;
      case 'FEED':
        await this._feedHandler(data, parentCtx);
        break;
      case 'DECUNREAD':
        await this._chatReadHandler(data as DefaultRes & DecunreadRes, parentCtx);
        break;
      case 'CHGMETA':
        await this._metaChangeHandler(data as DefaultRes & ChgMetaRes, parentCtx);
        break;
      case 'DELMEM':
        await this._userLeftHandler(data, parentCtx);
        break;
      case 'SYNCDLMSG':
        await this._msgDeleteHandler(data, parentCtx);
        break;
    }
  }
}

/**
 * Update channel list
 */
export interface ChannelListUpdater<T> {

  /**
   * Add channel
   *
   * @param channel
   */
  addChannel(channel: Channel): AsyncCommandResult<T>;

  /**
   * Remove channel from managing
   *
   * @param channel
   */
  removeChannel(channel: Channel): boolean;

}

export class TalkChannelListHandler<T extends Channel> implements Managed<ChannelListEvent<T>> {
  constructor(
    private _list: ChannelStore<T>,
    private _emitter: TypedEmitter<ChannelListEvent<T>>,
    private _updater: ChannelListUpdater<T>
  ) {

  }

  private _callEvent<E extends keyof ChannelListEvent<T>>(
    parentCtx: EventContext<ChannelListEvent<T>>,
    event: E, ...args: Parameters<ChannelListEvent<T>[E]>
  ) {
    this._emitter.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  async pushReceived(
    method: string,
    data: DefaultRes,
    parentCtx: EventContext<ChannelListEvent<T>>
  ): Promise<void> {
    switch (method) {
      case 'LEFT': {
        const leftData = data as DefaultRes & LeftRes;

        const channel = this._list.get(leftData.chatId);
        if (!channel) return;

        this._updater.removeChannel(channel);

        this._callEvent(
          parentCtx,
          'channel_left',
          channel,
        );
        break;
      }

      default: break;
    }
  }
}
