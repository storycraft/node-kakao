/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatLogged } from "../chat/chat";
import { CommandSession } from "../network/request-session";
import { KnownDataStatusCode } from "../packet/status-code";
import { CommandResult } from "../request/command-result";
import { OpenChannel } from "./channel";
import { OpenChannelInfo } from "./channel-info";

/**
 * Classes which provides openchannel session operations should implement this.
 */
export interface OpenChannelSessionOp {

    /**
     * Mark every chat as read until this chat.
     * @param chat 
     */
    markRead(chat: ChatLogged): Promise<CommandResult>;

    /**
     * Get latest open channel info
     */
    getChannelInfo(): Promise<CommandResult<OpenChannelInfo>>;

}

/**
 * Default OpenChannelSessionOp implementation.
 */
export class OpenChannelSession implements OpenChannelSessionOp {

    private _channel: OpenChannel;
    private _session: CommandSession;

    constructor(channel: OpenChannel, session: CommandSession) {
        this._channel = channel;
        this._session = session;
    }
    
    async markRead(chat: ChatLogged) {
        const status = (await this._session.request(
            'NOTIREAD',
            {
                'chatId': this._channel.channelId,
                'li': this._channel.linkId,
                'watermark': chat.logId
            }
        )).status;

        return {
            success: status === KnownDataStatusCode.SUCCESS,
            status,
        };
    }

    getChannelInfo(): Promise<CommandResult<OpenChannelInfo>> {
        // TODO: OpenChannelInfo

        throw new Error("Method not implemented.");
    }

};
