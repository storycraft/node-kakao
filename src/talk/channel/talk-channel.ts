/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { ChannelSession, ChannelSessionOp } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../user/channel-user-info";
import { Chat, ChatLogged } from "../../chat/chat";
import { CommandSession } from "../../network/request-session";
import { OpenChannelSession, OpenChannelSessionOp } from "../../channel/open-channel-session";

export class TalkChannel implements Channel, ChannelSessionOp {

    private _channelSession: ChannelSession;

    private _info: ChannelInfo;
    private _userInfoMap: Map<string, ChannelUserInfo>;

    constructor(private _channel: Channel, session: CommandSession) {
        this._channelSession = new ChannelSession(this, session);

        this._info = {} as any;
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

    pushReceived(method: string, data: DefaultRes) {
        
    }

}

export class TalkOpenChannel implements OpenChannel, ChannelSessionOp, OpenChannelSessionOp {
    
    private _channel: OpenChannel;

    private _channelSession: ChannelSession;
    private _openChannelSession: OpenChannelSession;

    private _info: OpenChannelInfo;
    private _userInfoMap: Map<string, OpenChannelUserInfo>;

    constructor(channel: OpenChannel, session: CommandSession) {
        this._channel = channel;

        this._channelSession = new ChannelSession(this, session);
        this._openChannelSession = new OpenChannelSession(this, session);

        this._info = {} as any;
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

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes) {
        
    }

}