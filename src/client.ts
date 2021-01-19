/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from ".";
import { LocoSession } from "./network/request-session";
import { ClientSession } from "./client/client-session";
import { TalkChannel, TalkOpenChannel } from "./talk/channel/talk-channel";
import { ChannelUser } from "./user/channel-user";

/**
 * Simple client implementation.
 */
export class TalkClient {

    private _session: LocoSession;

    private _clientSession: ClientSession;

    private _cilentUser: ChannelUser;

    private _channelMap: Map<string, TalkChannel | TalkOpenChannel>;

    constructor(session: LocoSession) {
        this._session = session;

        this._clientSession = new ClientSession(session.createProxy());

        this._cilentUser = { userId: Long.ZERO };

        this._channelMap = new Map();
    }

    get session() {
        return this._session;
    }

    get cilentUser() {
        return this._cilentUser;
    }

}