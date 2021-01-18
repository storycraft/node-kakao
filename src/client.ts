/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from ".";
import { LocoSession } from "./network/loco-session";
import { ClientSession } from "./talk/client/client-session";
import { ManagedChannel, ManagedOpenChannel } from "./talk/managed/managed-channel";
import { Sessioned } from "./talk/sessioned"
import { ChannelUser } from "./talk/user/channel-user";

/**
 * Simple client implementation.
 */
export class TalkClient implements Sessioned {

    private _session: ClientSession;

    private _cilentUser: ChannelUser;

    private _channelMap: Map<string, ManagedChannel | ManagedOpenChannel>;

    constructor(session: LocoSession) {
        this._session = new ClientSession(session);

        this._cilentUser = { userId: Long.ZERO };

        this._channelMap = new Map();
    }

    get session() {
        return this._session.session;
    }

    get cilentUser() {
        return this._cilentUser;
    }

    static login() {

    }

}