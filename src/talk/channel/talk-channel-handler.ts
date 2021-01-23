/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EventContext } from "../../event/event-context";
import { ChannelEvents, OpenChannelEvents } from "../../event/events";
import { DefaultRes } from "../../packet/bson-data-codec";
import { MsgRes } from "../../packet/chat/msg";
import { WrappedChatlog } from "../../packet/struct/wrapped/chat";
import { JsonUtil } from "../../util/json-util";
import { Managed } from "../managed";
import { AnyTalkChannel, TalkOpenChannel } from "./talk-channel";

/**
 * Capture and handle pushes coming to channel
 */
export class TalkChannelHandler implements Managed<ChannelEvents> {

    constructor(private _channel: AnyTalkChannel) {

    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        if (method === 'MSG') {
            const msgData = data as unknown as MsgRes;
            
            if (!this._channel.channelId.equals(msgData.chatId)) return;

            const chatLog = new WrappedChatlog(msgData.chatLog);
            
            new EventContext<ChannelEvents>(this._channel, parentCtx).emit(
                'chat',
                chatLog,
                this._channel,
                this._channel.getUserInfo(chatLog.sender)
            );
        }
    }

}

/**
 * Capture and handle pushes coming to open channel
 */
export class TalkOpenChannelHandler implements Managed<OpenChannelEvents> {

    constructor(private _channel: TalkOpenChannel) {

    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        
    }

}