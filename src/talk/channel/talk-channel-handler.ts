/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel } from "../../channel/channel";
import { ChannelInfo, SetChannelMeta } from "../../channel/channel-info";
import { ChannelList } from "../../channel/channel-list";
import { KnownChatType } from "../../chat/chat-type";
import { DeleteAllFeed, feedFromChat, OpenRewriteFeed } from "../../chat/feed/chat-feed";
import { KnownFeedType } from "../../chat/feed/feed-type";
import { EventContext } from "../../event/event-context";
import { ChannelEvents, ChannelListEvents, NormalChannelListEvents, OpenChannelEvents } from "../event/events";
import { OpenChannelInfo } from "../../openlink/open-channel-info";
import { DefaultRes } from "../../packet/bson-data-codec";
import { ChgMetaRes } from "../../packet/chat/chg-meta";
import { DecunreadRes } from "../../packet/chat/decunread";
import { LeftRes } from "../../packet/chat/left";
import { MsgRes } from "../../packet/chat/msg";
import { SyncJoinRes } from "../../packet/chat/sync-join";
import { ChatlogStruct } from "../../packet/struct/chat";
import { structToChatlog } from "../../packet/struct/wrap/chat";
import { AsyncCommandResult } from "../../request";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo } from "../../user/channel-user-info";
import { Managed } from "../managed";
import { TalkChannel } from "./talk-channel";
import { TalkNormalChannelList } from "./talk-normal-channel-list";

/**
 * Update channel info from handler
 */
export interface ChannelInfoUpdater<T extends ChannelInfo = ChannelInfo, U extends ChannelUserInfo = ChannelUserInfo> {

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

    private _callEvent<U extends keyof ChannelEvents>(parentCtx: EventContext<ChannelEvents>, event: U, ...args: Parameters<ChannelEvents[U]>) {
        this._channel.emit(event, ...args);
        parentCtx.emit(event, ...args);
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        switch (method) {
            case 'MSG': {
                const msgData = data as DefaultRes & MsgRes;

                if (!this._channel.channelId.equals(msgData.chatId)) break;

                const chatLog = structToChatlog(msgData.chatLog);

                this._callEvent(
                    parentCtx,
                    'chat',
                    chatLog,
                    this._channel
                );

                this._updater.updateInfo({
                    lastChatLogId: msgData.logId,
                    lastChatLog: chatLog
                });

                break;
            }

            case 'DECUNREAD': {
                const readData = data as DefaultRes & DecunreadRes;

                if (!this._channel.channelId.equals(readData.chatId)) break;

                const reader = this._channel.getUserInfo({ userId: readData.userId });

                this._updater.updateWatermark(readData.userId, readData.watermark);

                this._callEvent(
                    parentCtx,
                    'chat_read',
                    { logId: readData.watermark },
                    this._channel,
                    reader
                );

                break;
            }

            case 'CHGMETA': {
                const metaData = data as DefaultRes & ChgMetaRes;

                if (!this._channel.channelId.equals(metaData.chatId)) break;

                const metaType = metaData.meta.type;
                const meta = metaData.meta as SetChannelMeta;

                this._callEvent(
                    parentCtx,
                    'meta_change',
                    this._channel,
                    metaType,
                    meta
                );

                const metaMap = { ...this.info.metaMap };
                metaMap[metaType] = meta;

                this._updater.updateInfo({
                    metaMap
                });

                break;
            }

            case 'DELMEM': {
                const struct = data['chatLog'] as ChatlogStruct;
                if (!this._channel.channelId.eq(struct.chatId)) break;

                const chatLog = structToChatlog(struct);
                const user = this._channel.getUserInfo(chatLog.sender);
                if (!user) return;

                this._updater.updateUserInfo(chatLog.sender);

                if (chatLog.type !== KnownChatType.FEED) break;
                const feed = feedFromChat(chatLog);
                
                this._callEvent(
                    parentCtx,
                    'user_left',
                    chatLog,
                    this._channel,
                    user,
                    feed
                );
                break;
            }

            case 'NEWMEM': {
                const struct = data['chatLog'] as ChatlogStruct;
                if (!this._channel.channelId.eq(struct.chatId)) break;

                const chatLog = structToChatlog(struct);
                if (chatLog.type !== KnownChatType.FEED) break;

                this._updater.addUsers(chatLog.sender).then(usersRes => {
                    if (!usersRes.success) return;

                    const feed = feedFromChat(chatLog);
    
                    this._callEvent(
                        parentCtx,
                        'user_join',
                        chatLog,
                        this._channel,
                        usersRes.result[0],
                        feed
                    );
                });
                break;
            }

            case 'INVOICE': {
                // TODO
                break;
            }

            case 'SYNCDLMSG': {
                const struct = data['chatLog'] as ChatlogStruct;
                if (!this._channel.channelId.eq(struct.chatId)) break;

                const chatLog = structToChatlog(struct);
                if (chatLog.type !== KnownChatType.FEED) break;
                const feed = feedFromChat(chatLog);
                if (feed.feedType !== KnownFeedType.DELETE_TO_ALL) break;

                this._callEvent(
                    parentCtx,
                    'chat_deleted',
                    chatLog,
                    this._channel,
                    feed as DeleteAllFeed
                );
                break;
            }

            default: break;
        };
    }

}

export class TalkChannelListHandler implements Managed<ChannelListEvents> {

    constructor(private _list: ChannelList<TalkChannel>, private _updater: ChannelListUpdater<TalkChannel>) {

    }

    private _callEvent<U extends keyof ChannelListEvents>(parentCtx: EventContext<ChannelListEvents>, event: U, ...args: Parameters<ChannelListEvents[U]>) {
        this._list.emit(event, ...args);
        parentCtx.emit(event, ...args);
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelListEvents>) {
        switch (method) {
            case 'LEFT': {
                const leftData = data as DefaultRes & LeftRes;

                const channel = this._list.get(leftData.chatId);
                if (!channel) return;
                
                this._updater.removeChannel(channel);

                this._callEvent(
                    parentCtx,
                    'channel_left',
                    channel
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
                        res.result
                    );
                });
                break;
            }

            default: break;
        }
    }

}