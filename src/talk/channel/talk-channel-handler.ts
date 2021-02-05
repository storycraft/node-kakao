/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel, ChannelInfo, ChannelList, SetChannelMeta } from '../../channel';
import { DeleteAllFeed, feedFromChat, KnownChatType, KnownFeedType } from '../../chat';
import { EventContext } from '../../event';
import { ChannelEvents, ChannelListEvent } from '../event';
import { ChgMetaRes, DecunreadRes, LeftRes, MsgRes, SyncJoinRes } from '../../packet/chat';
import { ChatlogStruct, structToChatlog } from '../../packet/struct';
import { AsyncCommandResult, DefaultRes } from '../../request';
import { ChannelUser, ChannelUserInfo } from '../../user';
import { Managed } from '../managed';
import { TalkChannel } from '.';
import { TalkChatData } from '../chat';

/**
 * Update channel info from handler
 */
export interface ChannelInfoUpdater<T extends ChannelInfo, U extends ChannelUserInfo> {

    /**
     * Update channel info
     *
     * @param info
     */
    updateInfo(info: Partial<T>): void;

    /**
     * Update user info
     *
     * @param user
     * @param info If not supplied the user get deleted
     */
    updateUserInfo(user: ChannelUser, info?: Partial<U>): void;

    /**
     * Update users joined
     *
     * @param user
     */
    addUsers(...user: ChannelUser[]): AsyncCommandResult<U[]>;

    /**
     * Update watermark
     *
     * @param readerId
     * @param watermark
     */
    updateWatermark(readerId: Long, watermark: Long): void;

}

/**
 * Update channel list from handler
 */
export interface ChannelListUpdater<T extends Channel> {

    /**
     * Add channel to manage
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

/**
 * Capture and handle pushes coming to channel
 */
export class TalkChannelHandler implements Managed<ChannelEvents> {
  constructor(private _channel: TalkChannel, private _updater: ChannelInfoUpdater<ChannelInfo, ChannelUserInfo>) {

  }

  private get info() {
    return this._channel.info;
  }

  private _callEvent<U extends keyof ChannelEvents>(
      parentCtx: EventContext<ChannelEvents>,
      event: U, ...args: Parameters<ChannelEvents[U]>
  ) {
    this._channel.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  private _msgHandler(msgData: DefaultRes & MsgRes, parentCtx: EventContext<ChannelEvents>) {
    if (!this._channel.channelId.equals(msgData.chatId)) return;

    const chatLog = structToChatlog(msgData.chatLog);

    this._callEvent(
        parentCtx,
        'chat',
        new TalkChatData(chatLog),
        this._channel,
    );

    this._updater.updateInfo({
      lastChatLogId: msgData.logId,
      lastChatLog: chatLog,
    });
  }

  private _feedHandler(data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
    const channelId = data['c'] as Long;
    if (!this._channel.channelId.equals(channelId)) return;

    const chatLog = structToChatlog(data['chatLog'] as ChatlogStruct);
    this._callEvent(
        parentCtx,
        'chat',
        new TalkChatData(chatLog),
        this._channel,
    );

    this._updater.updateInfo({
      lastChatLogId: chatLog.logId,
      lastChatLog: chatLog,
    });
  }

  private _chatReadHandler(readData: DefaultRes & DecunreadRes, parentCtx: EventContext<ChannelEvents>) {
    if (!this._channel.channelId.equals(readData.chatId)) return;

    const reader = this._channel.getUserInfo({ userId: readData.userId });

    this._updater.updateWatermark(readData.userId, readData.watermark);

    this._callEvent(
        parentCtx,
        'chat_read',
        { logId: readData.watermark },
        this._channel,
        reader,
    );
  }

  private _metaChangeHandler(metaData: DefaultRes & ChgMetaRes, parentCtx: EventContext<ChannelEvents>) {
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

    this._updater.updateInfo({
      metaMap,
    });
  }

  private _userLeftHandler(data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
    const struct = data['chatLog'] as ChatlogStruct;
    if (!this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);
    const user = this._channel.getUserInfo(chatLog.sender);
    if (!user) return;

    this._updater.updateUserInfo(chatLog.sender);

    if (chatLog.type !== KnownChatType.FEED) return;
    const feed = feedFromChat(chatLog);

    this._callEvent(
        parentCtx,
        'user_left',
        chatLog,
        this._channel,
        user,
        feed,
    );
    return;
  }

  private _userJoinHandler(data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
    const struct = data['chatLog'] as ChatlogStruct;
    if (!this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);
    if (chatLog.type !== KnownChatType.FEED) return;

    this._updater.addUsers(chatLog.sender).then((usersRes) => {
      if (!usersRes.success) return;

      const feed = feedFromChat(chatLog);

      this._callEvent(
          parentCtx,
          'user_join',
          chatLog,
          this._channel,
          usersRes.result[0],
          feed,
      );
    });
  }

  private _msgDeleteHandler(data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
    const struct = data['chatLog'] as ChatlogStruct;
    if (!this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);
    if (chatLog.type !== KnownChatType.FEED) return;
    const feed = feedFromChat(chatLog);
    if (feed.feedType !== KnownFeedType.DELETE_TO_ALL) return;

    this._callEvent(
        parentCtx,
        'chat_deleted',
        chatLog,
        this._channel,
        feed as DeleteAllFeed,
    );
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>): void {
    switch (method) {
      case 'MSG':
        this._msgHandler(data as DefaultRes & MsgRes, parentCtx);
        break;
      case 'FEED':
        this._feedHandler(data, parentCtx);
        break;
      case 'DECUNREAD':
        this._chatReadHandler(data as DefaultRes & DecunreadRes, parentCtx);
        break;
      case 'CHGMETA':
        this._metaChangeHandler(data as DefaultRes & ChgMetaRes, parentCtx);
        break;
      case 'DELMEM':
        this._userLeftHandler(data, parentCtx);
        break;
      case 'NEWMEM':
        this._userJoinHandler(data, parentCtx);
        break;
      case 'SYNCDLMSG':
        this._msgDeleteHandler(data, parentCtx);
        break;
    }
  }
}

export class TalkChannelListHandler implements Managed<ChannelListEvent> {
  constructor(private _list: ChannelList<TalkChannel>, private _updater: ChannelListUpdater<TalkChannel>) {

  }

  private _callEvent<U extends keyof ChannelListEvent>(
      parentCtx: EventContext<ChannelListEvent>,
      event: U, ...args: Parameters<ChannelListEvent[U]>
  ) {
    this._list.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelListEvent>): void {
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

      case 'SYNCJOIN': {
        const joinData = data as DefaultRes & SyncJoinRes;

        this._updater.addChannel({ channelId: joinData.c }).then((res) => {
          if (!res.success) return;

          this._callEvent(
              parentCtx,
              'channel_join',
              res.result,
          );
        });
        break;
      }

      default: break;
    }
  }
}
