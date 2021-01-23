/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelInfo, ChannelMeta, NormalChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { ChannelSession, OpenChannelSession } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../user/channel-user-info";
import { Chat, ChatLogged } from "../../chat/chat";
import { CommandSession } from "../../network/request-session";
import { AsyncCommandResult } from "../../request/command-result";
import { TalkChannelSession, TalkOpenChannelSession } from "./talk-channel-session";
import { ChannelMetaType } from "../../packet/struct/channel";
import { TalkNormalChannelInfo, TalkOpenChannelInfo } from "./talk-channel-info";
import { TypedEmitter } from "tiny-typed-emitter";
import { ChannelEvents, OpenChannelEvents } from "../../event/events";
import { Managed } from "../managed";
import { EventContext } from "../../event/event-context";
import { TalkChannelHandler, TalkOpenChannelHandler } from "./talk-channel-handler";

export interface AnyTalkChannel extends Channel, ChannelSession, TypedEmitter<ChannelEvents> {

    readonly info: ChannelInfo;
    getUserInfo(user: ChannelUser): ChannelUserInfo | undefined;

    updateInfo(): AsyncCommandResult;

}

export class TalkChannel extends TypedEmitter<ChannelEvents> implements AnyTalkChannel, Managed<ChannelEvents> {

    private _info: TalkNormalChannelInfo;

    private _channelSession: TalkChannelSession;
    private _handler: TalkChannelHandler;

    private _userInfoMap: Map<string, ChannelUserInfo>;

    constructor(private _channel: Channel, session: CommandSession, info: Partial<NormalChannelInfo> = {}) {
        super();
        
        this._channelSession = new TalkChannelSession(this, session);
        this._handler = new TalkChannelHandler(this);

        this._info = TalkNormalChannelInfo.createPartial(info);

        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._channel.channelId;
    }

    get info(): NormalChannelInfo {
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

    async updateInfo(): AsyncCommandResult {
        const infoRes = await this.getChannelInfo();

        if (infoRes.success) {
            this._info = TalkNormalChannelInfo.createPartial(infoRes.result);
        }

        return infoRes;
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        this._handler.pushReceived(method, data, parentCtx);
    }

}

export class TalkOpenChannel extends TypedEmitter<OpenChannelEvents> implements OpenChannel, AnyTalkChannel, OpenChannelSession, Managed<OpenChannelEvents> {
    
    private _info: TalkOpenChannelInfo;

    private _channel: OpenChannel;

    private _channelSession: TalkChannelSession;
    private _openChannelSession: TalkOpenChannelSession;
    private _handler: TalkChannelHandler;
    private _openHandler: TalkOpenChannelHandler;

    private _userInfoMap: Map<string, OpenChannelUserInfo>;

    constructor(channel: OpenChannel, session: CommandSession, info: Partial<OpenChannelInfo> = {}) {
        super();
        
        this._channel = channel;

        this._info = TalkOpenChannelInfo.createPartial(info);

        this._channelSession = new TalkChannelSession(this, session);
        this._openChannelSession = new TalkOpenChannelSession(this, session);

        this._handler = new TalkChannelHandler(this);
        this._openHandler = new TalkOpenChannelHandler(this);

        this._userInfoMap = new Map();
    }

    get channelId() {
        return this._channel.channelId;
    }

    get linkId() {
        return this._channel.linkId;
    }

    get info(): OpenChannelInfo {
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

    async updateInfo() {
        const infoRes = await this.getChannelInfo();

        if (infoRes.success) {
            this._info = TalkOpenChannelInfo.createPartial(infoRes.result);
        }

        return infoRes;
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        this._handler.pushReceived(method, data, parentCtx);
        this._openHandler.pushReceived(method, data, parentCtx);
    }

}