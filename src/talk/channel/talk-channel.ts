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
import { AsyncCommandResult } from "../../request/command-result";
import { TalkChannelSession, TalkOpenChannelSession } from "./talk-channel-session";
import { ChannelMetaType } from "../../packet/struct/channel";
import { TypedEmitter } from "tiny-typed-emitter";
import { ChannelEvents, OpenChannelEvents } from "../../event/events";
import { Managed } from "../managed";
import { EventContext } from "../../event/event-context";
import { InfoUpdater, TalkChannelHandler, TalkOpenChannelHandler } from "./talk-channel-handler";
import { Long } from "bson";
import { NormalMemberStruct, OpenMemberStruct } from "../../packet/struct/user";
import { WrappedChannelUserInfo, WrappedOpenChannelUserInfo, WrappedOpenLinkChannelUserInfo } from "../../packet/struct/wrapped/user";
import { TalkSession } from "../../client";

export interface AnyTalkChannel extends Channel, ChannelSession, TypedEmitter<ChannelEvents> {

    /**
     * Channel info snapshot.
     * Info object may change when some infos updated.
     */
    readonly info: Readonly<ChannelInfo>;

    /**
     * Get client user
     */
    readonly clientUser: Readonly<ChannelUser>;
    
    /**
     * Get channel user info
     * 
     * @param user User to find
     */
    getUserInfo(user: ChannelUser): Readonly<AnyChannelUserInfo> | undefined;
    
    /**
     * Get every user info
     */
    getAllUserInfo(): Readonly<AnyChannelUserInfo>[];

    /**
     * Get total user count
     */
    readonly userCount: number;

    /**
     * Get read count of the chat.
     * This may not work correctly on channel with many users. (99+)
     * 
     * @param chat
     */
    getReadCount(chat: ChatLogged): number;

    /**
     * Get readers in this channel.
     * This may not work correctly on channel with many users. (99+)
     * 
     * @param chat 
     */
    getReaders(chat: ChatLogged): Readonly<AnyChannelUserInfo>[];

    /**
     * Update channel info and every user info
     */
    updateAll(): AsyncCommandResult;

}

export class TalkChannel extends TypedEmitter<ChannelEvents> implements AnyTalkChannel, Managed<ChannelEvents> {

    private _info: NormalChannelInfo;

    private _channelSession: TalkChannelSession;
    private _handler: TalkChannelHandler;

    private _userInfoMap: Map<string, ChannelUserInfo>;
    private _watermarkMap: Map<string, Long>;

    constructor(private _channel: Channel, session: TalkSession, info: Partial<NormalChannelInfo> = {}) {
        super();
        
        this._userInfoMap = new Map();
        this._watermarkMap = new Map();
        
        this._channelSession = new TalkChannelSession(this, session);
        this._handler = new TalkChannelHandler(this, {
            updateInfo: info => {
                this._info = { ...this._info, ...info };
            },

            updateWatermark: (readerId, watermark) => {
                this._watermarkMap.set(readerId.toString(), watermark);
            }
        });

        this._info = NormalChannelInfo.createPartial(info);
    }

    get clientUser() {
        return this._channelSession.session.clientUser;
    }

    get channelId() {
        return this._channel.channelId;
    }

    get info(): Readonly<NormalChannelInfo> {
        return this._info;
    }

    get userCount() {
        return this._userInfoMap.size;
    }

    getUserInfo(user: ChannelUser): Readonly<ChannelUserInfo> | undefined {
        return this._userInfoMap.get(user.userId.toString());
    }

    getAllUserInfo(): Readonly<ChannelUserInfo>[] {
        return Array.from(this._userInfoMap.values());
    }

    getReadCount(chat: ChatLogged): number {
        let count = 0;
        for (const watermark of this._watermarkMap.values()) {
            if (watermark.greaterThanOrEqual(chat.logId)) count++;
        }

        return count;
    }

    getReaders(chat: ChatLogged): Readonly<ChannelUserInfo>[] {
        let list: Readonly<ChannelUserInfo>[] = [];

        for (const [ strId, userInfo ] of this._userInfoMap) {
            const watermark = this._watermarkMap.get(strId);

            if (watermark && watermark.greaterThanOrEqual(chat.logId)) list.push(userInfo);
        }

        return list;
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

    async markRead(chat: ChatLogged) {
        const res = await this._channelSession.markRead(chat);

        if (res.success) {
            this._watermarkMap.set(this.clientUser.userId.toString(), chat.logId);
        }

        return res;
    }

    async setMeta(type: ChannelMetaType, meta: ChannelMeta | string) {
        const res = await this._channelSession.setMeta(type, meta);

        if (res.success) {
            this._info.metaMap[type] = res.result;
        }

        return res;
    }

    
    async chatON() {
        const res = await this._channelSession.chatON();

        if (res.success) {
            const { result } = res;
            
            if (this._info.type !== result.t || this._info.lastChatLogId !== result.l) {
                const newInfo = { ...this._info, type: result.t, lastChatLogId: result.l };
                this._info = newInfo;
            }

            if (result.a && result.w) {
                const watermarkMap = new Map();
                const userLen = result.a.length;
                for (let i = 0; i < userLen; i++) {
                    const userId = result.a[i];
                    const watermark = result.w[i];
    
                    watermarkMap.set(userId.toString(), watermark);
                }
                this._watermarkMap = watermarkMap;
            }

            if (result.m) {
                const userInfoMap = new Map();

                const structList = result.m as NormalMemberStruct[];
                structList.forEach(struct => {
                    const wrapped = new WrappedChannelUserInfo(struct);
                    
                    userInfoMap.set(wrapped.userId.toString(), wrapped);
                });

                this._userInfoMap = userInfoMap;
            } else if (result.mi) {
                await this.getAllLatestUserInfo();
            }
        }

        return res;
    }

    async getLatestChannelInfo() {
        const infoRes = await this._channelSession.getLatestChannelInfo();

        if (infoRes.success) {
            this._info = NormalChannelInfo.createPartial(infoRes.result);
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
            const userInfoMap = new Map();
            infoRes.result.map(info => userInfoMap.set(info.userId.toString(), info));

            this._userInfoMap = userInfoMap;
        }

        return infoRes;
    }

    async updateAll(): AsyncCommandResult {
        const infoRes = await this.getLatestChannelInfo();
        if (!infoRes.success) return infoRes;

        return this.chatON();
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        this._handler.pushReceived(method, data, parentCtx);
    }

}

export class TalkOpenChannel extends TypedEmitter<OpenChannelEvents> implements OpenChannel, AnyTalkChannel, OpenChannelSession, Managed<OpenChannelEvents> {
    
    private _info: OpenChannelInfo;

    private _channel: OpenChannel;

    private _channelSession: TalkChannelSession;
    private _openChannelSession: TalkOpenChannelSession;
    private _handler: TalkChannelHandler;
    private _openHandler: TalkOpenChannelHandler;

    private _userInfoMap: Map<string, OpenChannelUserInfo>;
    private _watermarkMap: Map<string, Long>;

    constructor(channel: OpenChannel, session: TalkSession, info: Partial<OpenChannelInfo> = {}) {
        super();
        
        this._channel = channel;

        this._info = OpenChannelInfo.createPartial(info);
        this._watermarkMap = new Map();

        this._channelSession = new TalkChannelSession(this, session);
        this._openChannelSession = new TalkOpenChannelSession(this, session);

        const infoUpdater: InfoUpdater<OpenChannelInfo> = {
            updateInfo: info => {
                this._info = { ...this._info, ...info };
            },

            updateWatermark: (readerId, watermark) => {
                this._watermarkMap.set(readerId.toString(), watermark);
            }
        };

        this._handler = new TalkChannelHandler(this, infoUpdater);
        this._openHandler = new TalkOpenChannelHandler(this, infoUpdater);

        this._userInfoMap = new Map();
    }

    get clientUser() {
        return this._channelSession.session.clientUser;
    }

    get channelId() {
        return this._channel.channelId;
    }

    get linkId() {
        return this._channel.linkId;
    }

    get info(): Readonly<OpenChannelInfo> {
        return this._info;
    }

    get userCount() {
        return this._userInfoMap.size;
    }

    getUserInfo(user: ChannelUser): Readonly<OpenChannelUserInfo> | undefined {
        return this._userInfoMap.get(user.userId.toString());
    }

    getAllUserInfo(): Readonly<OpenChannelUserInfo>[] {
        return Array.from(this._userInfoMap.values());
    }

    getReadCount(chat: ChatLogged): number {
        let count = 0;
        for (const watermark of this._watermarkMap.values()) {
            if (watermark.greaterThanOrEqual(chat.logId)) count++;
        }

        return count;
    }

    getReaders(chat: ChatLogged): Readonly<OpenChannelUserInfo>[] {
        let list: Readonly<OpenChannelUserInfo>[] = [];

        for (const [ strId, userInfo ] of this._userInfoMap) {
            const watermark = this._watermarkMap.get(strId);

            if (watermark && watermark.greaterThanOrEqual(chat.logId)) list.push(userInfo);
        }

        return list;
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

    async markRead(chat: ChatLogged) {
        const res = await this._openChannelSession.markRead(chat);

        if (res.success) {
            this._watermarkMap.set(this.clientUser.userId.toString(), chat.logId);
        }

        return res;
    }

    async setMeta(type: ChannelMetaType, meta: ChannelMeta) {
        const res = await this._channelSession.setMeta(type, meta);

        if (res.success) {
            this._info.metaMap[type] = res.result;
        }

        return res;
    }

    async chatON() {
        const res = await this._channelSession.chatON();

        if (res.success) {
            const { result } = res;
            
            if (this._info.type !== result.t || this._info.lastChatLogId !== result.l || this._info.openToken !== result.otk) {
                const newInfo = { ...this._info, type: result.t, lastChatLogId: result.l };
                if (result.otk) {
                    newInfo['openToken'] = result.otk;
                }
                this._info = newInfo;
            }

            if (result.a && result.w) {
                const watermarkMap = new Map();
                const userLen = result.a.length;
                for (let i = 0; i < userLen; i++) {
                    const userId = result.a[i];
                    const watermark = result.w[i];
    
                    watermarkMap.set(userId.toString(), watermark);
                }
                this._watermarkMap = watermarkMap;
            }

            if (result.m) {
                const userInfoMap = new Map();

                const structList = result.m as OpenMemberStruct[];
                structList.forEach(struct => {
                    const wrapped = new WrappedOpenChannelUserInfo(struct);
                    
                    userInfoMap.set(wrapped.userId.toString(), wrapped);
                });

                this._userInfoMap = userInfoMap;
            } else if (result.mi) {
                await this.getAllLatestUserInfo();
            }

            if (result.olu) {
                const wrapped = new WrappedOpenLinkChannelUserInfo(result.olu);
                this._userInfoMap.set(wrapped.userId.toString(), wrapped);
            }
        }

        return res;
    }

    async getLatestChannelInfo() {
        const infoRes = await this._openChannelSession.getLatestChannelInfo();

        if (infoRes.success) {
            this._info = OpenChannelInfo.createPartial(infoRes.result);
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
            const userInfoMap = new Map();
            infoRes.result.map(info => userInfoMap.set(info.userId.toString(), info));

            this._userInfoMap = userInfoMap;
        }

        return infoRes;
    }

    async updateAll(): AsyncCommandResult {
        const infoRes = await this.getLatestChannelInfo();
        if (!infoRes.success) return infoRes;

        return this.chatON();
    }

    // Called when broadcast packets are recevied.
    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        this._handler.pushReceived(method, data, parentCtx);
        this._openHandler.pushReceived(method, data, parentCtx);
    }

}