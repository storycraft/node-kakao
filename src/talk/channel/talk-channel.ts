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
import { ChannelUserInfo, OpenChannelUserInfo, AnyChannelUserInfo } from "../../user/channel-user-info";
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

    /**
     * Channel info
     */
    readonly info: ChannelInfo;
    
    /**
     * Get channel user info.
     * @param user User to find
     */
    getUserInfo(user: ChannelUser): AnyChannelUserInfo | undefined;

    /**
     * Update channel info and every user info
     */
    updateAll(): AsyncCommandResult;

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

    get info() {
        return this._info;
    }

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

    async getLatestChannelInfo() {
        const infoRes = await this._channelSession.getLatestChannelInfo();

        if (infoRes.success) {
            this._info = TalkNormalChannelInfo.createPartial(infoRes.result);
        }

        return infoRes;
    }

    async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<ChannelUserInfo[]> {
        const infoRes = await this._channelSession.getLatestUserInfo(...users);

        if (infoRes.success) {
            const result = infoRes.result as ChannelUserInfo[];

            result.forEach(info => this._userInfoMap.set(info.userId.toString(), info));
        }

        return infoRes;
    }
    
    async getAllLatestUserInfo(): AsyncCommandResult<ChannelUserInfo[]> {
        const infoRes = await this._channelSession.getAllLatestUserInfo();

        if (infoRes.success) {
            this._userInfoMap.clear();
            infoRes.result.map(info => this._userInfoMap.set(info.userId.toString(), info));
        }

        return infoRes;
    }

    async updateAll(): AsyncCommandResult {
        const infoRes = await this.getLatestChannelInfo();
        if (!infoRes.success) return infoRes;

        return this.getAllLatestUserInfo();
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

    async getLatestChannelInfo() {
        const infoRes = await this._openChannelSession.getLatestChannelInfo();

        if (infoRes.success) {
            this._info = TalkOpenChannelInfo.createPartial(infoRes.result);
        }

        return infoRes;
    }

    async getLatestUserInfo(...users: ChannelUser[]): AsyncCommandResult<OpenChannelUserInfo[]> {
        const infoRes = await this._openChannelSession.getLatestUserInfo(...users);

        if (infoRes.success) {
            const result = infoRes.result as OpenChannelUserInfo[];

            result.forEach(info => this._userInfoMap.set(info.userId.toString(), info));
        }

        return infoRes;
    }
    
    async getAllLatestUserInfo(): AsyncCommandResult<OpenChannelUserInfo[]> {
        const infoRes = await this._openChannelSession.getAllLatestUserInfo();

        if (infoRes.success) {
            this._userInfoMap.clear();
            infoRes.result.map(info => this._userInfoMap.set(info.userId.toString(), info));
        }

        return infoRes;
    }

    async updateAll(): AsyncCommandResult {
        const infoRes = await this.getLatestChannelInfo();
        if (!infoRes.success) return infoRes;

        return this.getAllLatestUserInfo();
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        this._handler.pushReceived(method, data, parentCtx);
        this._openHandler.pushReceived(method, data, parentCtx);
    }

}