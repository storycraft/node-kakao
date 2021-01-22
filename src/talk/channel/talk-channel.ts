/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelMeta, NormalChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { ChannelSession, OpenChannelSession } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../user/channel-user-info";
import { Chat, ChatLogged } from "../../chat/chat";
import { CommandSession } from "../../network/request-session";
import { AsyncCommandResult } from "../../request/command-result";
import { TalkChannelSession, TalkOpenChannelSession } from "./talk-channel-session";
import { ChannelMetaType } from "../../packet/struct/channel";
import { TalkNormalChannelInfo, TalkOpenChannelInfo } from "./talk-channel-info";

export class TalkChannel implements Channel, ChannelSession {

    private _info: TalkNormalChannelInfo;

    private _channelSession: TalkChannelSession;

    private _userInfoMap: Map<string, ChannelUserInfo>;

    constructor(private _channel: Channel, session: CommandSession, info: Partial<NormalChannelInfo> = {}) {
        this._channelSession = new TalkChannelSession(this, session);

        this._info = TalkNormalChannelInfo.createPartial(info);

        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._channel.channelId;
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

    sendChat(chat: string | Chat) {
        return this._channelSession.sendChat(chat);
    }

    forwardChat(chat: Chat) {
        return this._channelSession.forwardChat(chat);
    }

    deleteChat(chat: ChatLogged) {
        return this._channelSession.deleteChat(chat);
    }

    markRead(chat: ChatLogged) {
        return this._channelSession.markRead(chat);
    }

    async setMeta(type: ChannelMetaType, meta: ChannelMeta | string) {
        const res = await this._channelSession.setMeta(type, meta);

        if (res.success) {
            this._info.metaMap[type] = res.result;
        }

        return res;
    }

    getChannelInfo() {
        return this._channelSession.getChannelInfo();
    }

    /**
     * Get channel info and update it.
     */
    async updateInfo(): AsyncCommandResult {
        const infoRes = await this.getChannelInfo();
        if (!infoRes.success) return infoRes;

        this._info = TalkNormalChannelInfo.createPartial(infoRes.result);

        return { status: infoRes.status, success: true };
    }

    pushReceived(method: string, data: DefaultRes) {
        
    }

}

export class TalkOpenChannel implements OpenChannel, ChannelSession, OpenChannelSession {
    
    private _info: TalkOpenChannelInfo;

    private _channel: OpenChannel;

    private _channelSession: TalkChannelSession;
    private _openChannelSession: TalkOpenChannelSession;

    private _userInfoMap: Map<string, OpenChannelUserInfo>;

    constructor(channel: OpenChannel, session: CommandSession, info: Partial<OpenChannelInfo> = {}) {
        this._channel = channel;

        this._info = TalkOpenChannelInfo.createPartial(info);

        this._channelSession = new TalkChannelSession(this, session);
        this._openChannelSession = new TalkOpenChannelSession(this, session);

        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._channel.channelId;
    }

    get linkId() {
        return this._channel.linkId;
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

    async sendChat(chat: string | Chat) {
        const res = await this._channelSession.sendChat(chat);

        return res;
    }

    forwardChat(chat: Chat) {
        return this._channelSession.forwardChat(chat);
    }

    deleteChat(chat: ChatLogged) {
        return this._channelSession.deleteChat(chat);
    }

    markRead(chat: ChatLogged) {
        return this._openChannelSession.markRead(chat);
    }

    async setMeta(type: ChannelMetaType, meta: ChannelMeta) {
        const res = await this._channelSession.setMeta(type, meta);

        if (res.success) {
            this._info.metaMap[type] = res.result;
        }

        return res;
    }

    getChannelInfo() {
        return this._openChannelSession.getChannelInfo();
    }

     /**
     * Get open channel info and update it.
     */
    async updateInfo() {
        const infoRes = await this.getChannelInfo();

        if (infoRes.success) {
            this._info = TalkOpenChannelInfo.createPartial(infoRes.result);
        }

        return infoRes;
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes) {
        
    }

}