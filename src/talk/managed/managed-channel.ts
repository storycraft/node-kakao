/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel, OpenChannel } from "../channel/channel";
import { ChannelInfo, OpenChannelInfo } from "../channel/channel-info";
import { ChannelSession, OpenChannelSession } from "../channel/channel-session";
import { ChannelUser } from "../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../user/channel-user-info";
import { Managed } from "./managed";

/**
 * Normal channel that manages Channel datas.
 */
export class ManagedChannel implements Channel, Managed {

    private _session: ChannelSession;

    private _info: ChannelInfo;
    private _userInfoMap: Map<string, ChannelUserInfo>;

    constructor(session: ChannelSession) {
        this._session = session;

        this._info = {} as any;
        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._session.channelId;
    }

    get info() {
        return this._info;
    }

    /**
     * Get channel user info.
     * @param user User to find
     */
    getUserInfo(user: ChannelUser) {
        return this._userInfoMap.get(user.userId.toString());
    }

    pushReceived(method: string, data: DefaultRes) {

    }

}

/**
 * Channel that manages OpenChannel datas.
 */
export class ManagedOpenChannel implements OpenChannel, Managed {
    
    private _session: OpenChannelSession;

    private _info: OpenChannelInfo;
    private _userInfoMap: Map<string, OpenChannelUserInfo>;

    constructor(session: OpenChannelSession) {
        this._session = session;

        this._info = {} as any;
        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._session.channelId;
    }

    get linkId() {
        return this._session.linkId;
    }

    get info() {
        return this._info;
    }

    /**
     * Get channel open user info
     * @param user User to find
     */
    getUserInfo(user: ChannelUser) {
        return this._userInfoMap.get(user.userId.toString());
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes) {

    }

}