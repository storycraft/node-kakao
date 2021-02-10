/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { feedFromChat, KnownChatType, KnownFeedType, OpenKickFeed, OpenRewriteFeed } from '../../chat';
import { EventContext } from '../../event';
import { OpenChannelInfo, OpenChannelUserPerm } from '../../openlink';
import { DefaultRes } from '../../request';
import { LinkKickedRes, SyncEventRes, SyncLinkPfRes, SyncMemTRes } from '../../packet/chat';
import {
  ChannelInfoStruct,
  ChatlogStruct,
  structToChatlog,
  structToOpenLinkChannelUserInfo,
} from '../../packet/struct';
import { OpenChannelUserInfo } from '../../user';
import { ChannelInfoUpdater, ChannelListUpdater } from '../channel';
import { OpenChannelEvents, OpenChannelListEvents } from '../event';
import { Managed } from '../managed';
import { TalkOpenChannel } from './talk-open-channel';
import { TalkOpenChannelList } from './talk-open-channel-list';

/**
 * Capture and handle pushes coming to open channel
 */
export class TalkOpenChannelHandler implements Managed<OpenChannelEvents> {
  constructor(
    private _channel: TalkOpenChannel,
    private _updater: ChannelInfoUpdater<OpenChannelInfo, OpenChannelUserInfo>,
  ) {

  }

  private _callEvent<U extends keyof OpenChannelEvents>(
      parentCtx: EventContext<OpenChannelEvents>,
      event: U,
      ...args: Parameters<OpenChannelEvents[U]>
  ) {
    this._channel.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  private _hostHandoverHandler(memTData: DefaultRes & SyncMemTRes, parentCtx: EventContext<OpenChannelEvents>) {
    if (!this._channel.channelId.eq(memTData.c) && !this._channel.linkId.eq(memTData.li)) return;

    const len = memTData.mids.length;
    for (let i = 0; i < len; i++) {
      const user = { userId: memTData.mids[i] };
      const perm = memTData.mts[i];

      if (!perm) continue;

      const lastInfo = this._channel.getUserInfo(user);
      this._updater.updateUserInfo(user, { perm });
      const info = this._channel.getUserInfo(user);
      if (lastInfo && info) {
        if (perm === OpenChannelUserPerm.OWNER) {
          const lastLink = this._channel.info.openLink;
          if (lastLink) {
            this._channel.getLatestOpenLink().then((res) => {
              if (!res.success) return;

              this._callEvent(parentCtx, 'host_handover', this._channel, lastLink, res.result);
            });
          }
        }

        this._callEvent(parentCtx, 'perm_changed', this._channel, lastInfo, info);
      }
    }
  }

  private _profileChangedHandler(pfData: DefaultRes & SyncLinkPfRes, parentCtx: EventContext<OpenChannelEvents>) {
    if (!this._channel.channelId.eq(pfData.c) && !this._channel.linkId.eq(pfData.li)) return;

    const updated = structToOpenLinkChannelUserInfo(pfData.olu);
    const last = this._channel.getUserInfo(updated);
    if (!last) return;

    this._updater.updateUserInfo(updated, updated);

    this._callEvent(
        parentCtx,
        'profile_changed',
        this._channel,
        last,
        updated,
    );
  }

  private _msgHiddenHandler(data: DefaultRes, parentCtx: EventContext<OpenChannelEvents>) {
    const struct = data['chatLog'] as ChatlogStruct;
    if (!this._channel.channelId.eq(struct.chatId)) return;

    const chatLog = structToChatlog(struct);
    if (chatLog.type !== KnownChatType.FEED) return;
    const feed = feedFromChat(chatLog);
    if (feed.feedType !== KnownFeedType.OPENLINK_REWRITE_FEED) return;

    this._callEvent(
        parentCtx,
        'message_hidden',
        chatLog,
        this._channel,
        feed as OpenRewriteFeed,
    );
  }

  private _chatEventHandler(syncEventData: DefaultRes & SyncEventRes, parentCtx: EventContext<OpenChannelEvents>) {
    if (!this._channel.channelId.eq(syncEventData.c) && !this._channel.linkId.eq(syncEventData.li)) return;

    const user = this._channel.getUserInfo({ userId: syncEventData.authorId });
    if (!user) return;

    this._callEvent(
        parentCtx,
        'chat_event',
        this._channel,
        user,
        syncEventData.et,
        syncEventData.ec,
        { logId: syncEventData.logId, type: syncEventData.t },
    );
  }

  private _channelLinkDeletedHandler(data: DefaultRes, parentCtx: EventContext<OpenChannelEvents>) {
    if (!this._channel.linkId.eq(data['li'] as Long)) return;
    const struct = data['chatLog'] as ChatlogStruct;

    const chatLog = structToChatlog(struct);
    if (chatLog.type !== KnownChatType.FEED) return;
    const feed = feedFromChat(chatLog);
    if (feed.feedType !== KnownFeedType.OPENLINK_DELETE_LINK) return;

    this._callEvent(
        parentCtx,
        'channel_link_deleted',
        chatLog,
        this._channel,
        feed,
    );
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelEvents>): void {
    switch (method) {
      case 'SYNCMEMT':
        this._hostHandoverHandler(data as DefaultRes & SyncMemTRes, parentCtx);
        break;
      case 'SYNCLINKPF':
        this._profileChangedHandler(data as DefaultRes & SyncLinkPfRes, parentCtx);
        break;
      case 'SYNCREWR':
        this._msgHiddenHandler(data, parentCtx);
        break;
      case 'SYNCEVENT':
        this._chatEventHandler(data as DefaultRes & SyncEventRes, parentCtx);
        break;
      case 'LNKDELETED':
        this._channelLinkDeletedHandler(data, parentCtx);
        break;
    }
  }
}

export class TalkOpenChannelListHandler implements Managed<OpenChannelListEvents> {
  constructor(private _list: TalkOpenChannelList, private _updater: ChannelListUpdater<TalkOpenChannel>) {

  }

  private _callEvent<U extends keyof OpenChannelListEvents>(
      parentCtx: EventContext<OpenChannelListEvents>,
      event: U,
      ...args: Parameters<OpenChannelListEvents[U]>
  ) {
    this._list.emit(event, ...args);
    parentCtx.emit(event, ...args);
  }

  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelListEvents>): void {
    switch (method) {
      case 'SYNCLINKCR': {
        const chatRoom = data['chatRoom'] as ChannelInfoStruct;
        if (!chatRoom) break;

        this._updater.addChannel({ channelId: chatRoom.chatId }).then((channelRes) => {
          if (!channelRes.success) return;

          this._callEvent(
              parentCtx,
              'channel_join',
              channelRes.result,
          );
        });

        break;
      }

      case 'LINKKICKED': {
        const kickData = data as DefaultRes & LinkKickedRes;

        const kickedChannel = this._list.get(kickData.c);
        if (!kickedChannel) return;

        const chatLog = structToChatlog(kickData.chatLog);
        if (chatLog.type !== KnownChatType.FEED) return;
        const feed = feedFromChat(chatLog);
        if (feed.feedType !== KnownFeedType.OPENLINK_KICKED) return;

        this._callEvent(
            parentCtx,
            'channel_kicked',
            chatLog,
            kickedChannel,
                    feed as OpenKickFeed,
        );

        break;
      }

      case 'SYNCLINKDL': {
        const linkId = data['li'] as Long;

        const channel = this._list.getChannelByLinkId(linkId);
        if (!channel) return;

        this._updater.removeChannel(channel);
        this._callEvent(
            parentCtx,
            'channel_left',
            channel,
        );
      }
    }
  }
}
