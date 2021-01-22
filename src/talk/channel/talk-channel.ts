/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelInfo, NormalChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { ChannelSession, OpenChannelSession } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../user/channel-user-info";
import { Chat, ChatLogged } from "../../chat/chat";
import { CommandSession } from "../../network/request-session";
import { CommandResult } from "../../request/command-result";
import { TalkChannelSession, TalkOpenChannelSession } from "./talk-channel-session";

export class TalkChannel implements Channel, ChannelSession {

    private _channelSession: TalkChannelSession;

    private _userInfoMap: Map<string, ChannelUserInfo>;

    constructor(private _channel: Channel, session: CommandSession, private _info: NormalChannelInfo | null = null) {
        this._channelSession = new TalkChannelSession(this, session);

        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._channel.channelId;
    }

    get info() {
        if (!this._info) throw 'Channel info is invalid';

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

    getChannelInfo() {
        return this._channelSession.getChannelInfo();
    }

    /**
     * Get channel info and update it.
     */
    async updateInfo(): Promise<CommandResult> {
        const infoRes = await this.getChannelInfo();
        if (!infoRes.success) return infoRes;

        this._info = infoRes.result;

        return { status: infoRes.status, success: true };
    }

    pushReceived(method: string, data: DefaultRes) {
        
    }

}

export class TalkOpenChannel implements OpenChannel, ChannelSession, OpenChannelSession {
    
    private _channel: OpenChannel;

    private _channelSession: TalkChannelSession;
    private _openChannelSession: TalkOpenChannelSession;

    private _userInfoMap: Map<string, OpenChannelUserInfo>;

    constructor(channel: OpenChannel, session: CommandSession, private _info: OpenChannelInfo | null = null) {
        this._channel = channel;

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
        if (!this._info) throw 'Channel info is invalid';
        
        return this._info;
    }

    /**
     * Get channel open user info
     * @param user User to find
     */
    getUserInfo(user: ChannelUser) {
        return this._userInfoMap.get(user.userId.toString());
    }

    sendChat(chat: string | Chat) {
        return this._channelSession.sendChat(chat);
    }

    forwardChat(chat: Chat): Promise<DefaultRes> {
        return this._channelSession.forwardChat(chat);
    }

    deleteChat(chat: ChatLogged) {
        return this._channelSession.deleteChat(chat);
    }

    markRead(chat: ChatLogged) {
        return this._openChannelSession.markRead(chat);
    }

    getChannelInfo(): Promise<CommandResult<OpenChannelInfo>> {
        return this._openChannelSession.getChannelInfo();
    }

     /**
     * Get open channel info and update it.
     */
    async updateInfo(): Promise<CommandResult> {
        const infoRes = await this.getChannelInfo();
        if (!infoRes.success) return infoRes;

        this._info = infoRes.result;

        return { status: infoRes.status, success: true };
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes) {
        
    }

}