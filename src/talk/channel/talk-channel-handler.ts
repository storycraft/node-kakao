/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { ChannelInfo, OpenChannelInfo, SetChannelMeta } from "../../channel/channel-info";
import { EventContext } from "../../event/event-context";
import { ChannelEvents, ChannelListEvents, OpenChannelEvents } from "../../event/events";
import { DefaultRes } from "../../packet/bson-data-codec";
import { ChgMetaRes } from "../../packet/chat/chg-meta";
import { DecunreadRes } from "../../packet/chat/decunread";
import { LeftRes } from "../../packet/chat/left";
import { MsgRes } from "../../packet/chat/msg";
import { WrappedChatlog } from "../../packet/struct/wrapped/chat";
import { ChannelUser } from "../../user/channel-user";
import { Managed } from "../managed";
import { AnyTalkChannel, TalkOpenChannel } from "./talk-channel";
import { TalkChannelList } from "./talk-channel-list";

/**
 * Update channel info from handler
 */
export interface InfoUpdater<T extends ChannelInfo = ChannelInfo> {
    
    updateInfo: (info: Partial<T>) => void;
    updateWatermark: (readerId: Long, watermark: Long) => void;

}

/**
 * Capture and handle pushes coming to channel
 */
export class TalkChannelHandler implements Managed<ChannelEvents> {

    constructor(private _channel: AnyTalkChannel, private _updater: InfoUpdater) {

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
    
                const chatLog = new WrappedChatlog(msgData.chatLog);
                
                this._callEvent(
                    parentCtx,
                    'chat',
                    chatLog,
                    this._channel,
                    this._channel.getUserInfo(chatLog.sender)
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

                this._callEvent(
                    parentCtx,
                    'chat_read',
                    { logId: readData.watermark },
                    this._channel,
                    reader
                );
                
                this._updater.updateWatermark(readData.userId, readData.watermark);

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

            default: break;
        };
    }

}

/**
 * Capture and handle pushes coming to open channel
 */
export class TalkOpenChannelHandler implements Managed<OpenChannelEvents> {

    constructor(private _channel: TalkOpenChannel, private _updater: InfoUpdater<OpenChannelInfo>) {

    }

    private _callEvent<U extends keyof OpenChannelEvents>(parentCtx: EventContext<OpenChannelEvents>, event: U, ...args: Parameters<OpenChannelEvents[U]>) {
        this._channel.emit(event, ...args);
        parentCtx.emit(event, ...args);
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        
    }

}

export class TalkChannelListHandler implements Managed<ChannelListEvents> {

    constructor(private _list: TalkChannelList) {

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
                this._list.delete(channel.channelId);

                this._callEvent(
                    parentCtx,
                    'channel_left',
                    channel
                );
                break;
            }

            default: break;
        }
    }

}