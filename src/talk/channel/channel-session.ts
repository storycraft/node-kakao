/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSession } from "../../network/loco-session";
import { Chat } from "../chat/chat";
import { Sessioned } from "../sessioned";
import { Channel, OpenChannel } from "./channel";

type Constructor<T> = new (...args: any[]) => T;

export function ChannelSessionMixin<T extends Constructor<Sessioned & Channel>>(Base: T) {
    return class extends Base {

        /**
        * Send chat to channel
        * @param chat 
         */
        sendChat(chat: Chat) {
            
        }

        /**
         * Send chat using forward method
         */
        forwardChat(chat: Chat) {

        }

    };
}

export function OpenChannelSessionMixin<T extends Constructor<Sessioned & OpenChannel>>(Base: T) {
    return class extends Base {

        

    };
}

class SessionedChannel implements Sessioned, Channel {

    private _channel: Channel;
    private _session: LocoSession;

    constructor(channel: Channel, session: LocoSession) {
        this._channel = channel;
        this._session = session;
    }

    get channelId() {
        return this._channel.channelId;
    }

    get session() {
        return this._session;
    }

}

class SessionedOpenChannel implements Sessioned, OpenChannel {

    private _channel: OpenChannel;
    private _session: LocoSession;

    constructor(channel: OpenChannel, session: LocoSession) {
        this._channel = channel;
        this._session = session;
    }

    get channelId() {
        return this._channel.channelId;
    }

    get linkId() {
        return this._channel.linkId;
    }

    get session() {
        return this._session;
    }

}

/**
 * 
 */
export const ChannelSession = ChannelSessionMixin(SessionedChannel);

export const OpenChannelSession = OpenChannelSessionMixin(ChannelSessionMixin(SessionedOpenChannel));