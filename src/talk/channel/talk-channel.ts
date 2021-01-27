/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";
import { Channel } from "../../channel/channel";
import { ChannelInfo, ChannelMeta, NormalChannelInfo } from "../../channel/channel-info";
import { ChannelSession } from "../../channel/channel-session";
import { ChannelUser } from "../../user/channel-user";
import { NormalChannelUserInfo, ChannelUserInfo } from "../../user/channel-user-info";
import { Chat, ChatLogged } from "../../chat/chat";
import { AsyncCommandResult } from "../../request";
import { TalkChannelSession } from "./talk-channel-session";
import { ChannelMetaType, KnownChannelMetaType } from "../../packet/struct/channel";
import { TypedEmitter } from "tiny-typed-emitter";
import { Managed } from "../managed";
import { EventContext } from "../../event/event-context";
import { TalkChannelHandler } from "./talk-channel-handler";
import { Long } from "bson";
import { NormalMemberStruct } from "../../packet/struct/user";
import { TalkSession } from "../client";
import { structToChannelUserInfo } from "../../packet/struct/wrap/user";
import { MediaComponent } from "../../media/media";
import { ChatType } from "../../chat/chat-type";
import { ChannelEvents } from "../event/events";

export interface TalkChannel extends Channel, ChannelSession, TypedEmitter<ChannelEvents> {

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
     * Get channel name
     */
    getName(): string;

    /**
     * Get displayed channel name
     */
    getDisplayName(): string;

    /**
     * Get channel user info
     *
     * @param user User to find
     */
    getUserInfo(user: ChannelUser): Readonly<ChannelUserInfo> | undefined;

    /**
     * Get user info iterator
     */
    getAllUserInfo(): IterableIterator<ChannelUserInfo>;

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
    getReaders(chat: ChatLogged): Readonly<ChannelUserInfo>[];

    /**
     * Update channel info and every user info
     */
    updateAll(): AsyncCommandResult;

}

export class TalkNormalChannel extends TypedEmitter<ChannelEvents> implements TalkChannel, Managed<ChannelEvents> {

    private _info: NormalChannelInfo;

    private _channelSession: TalkChannelSession;
    private _handler: TalkChannelHandler;

    private _userInfoMap: Map<string, NormalChannelUserInfo>;
    private _watermarkMap: Map<string, Long>;

    constructor(private _channel: Channel, session: TalkSession, info: Partial<NormalChannelInfo> = {}) {
        super();

        this._userInfoMap = new Map();
        this._watermarkMap = new Map();

        this._channelSession = new TalkChannelSession(this, session);
        this._handler = new TalkChannelHandler(this, {
            updateInfo: info => this._info = { ...this._info, ...info },

            updateUserInfo: (user, info) => {
                const strId = user.userId.toString();

                if (!info) {
                    this._userInfoMap.delete(strId);
                } else {
                    const lastInfo = this._userInfoMap.get(strId);

                    if (lastInfo) {
                        this._userInfoMap.set(strId, {...lastInfo, ...info });
                    }
                }
            },

            addUsers: (...user) => this.getLatestUserInfo(...user),

            updateWatermark: (readerId, watermark) => this._watermarkMap.set(readerId.toString(), watermark)
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

    getName() {
        const nameMeta = this._info.metaMap[KnownChannelMetaType.TITLE];
        return nameMeta && nameMeta.content || '';
    }

    getDisplayName() {
        return this.getName() || this._info.displayUserList.map(user => user.nickname).join(', ');
    }

    getUserInfo(user: ChannelUser): Readonly<NormalChannelUserInfo> | undefined {
        return this._userInfoMap.get(user.userId.toString());
    }

    getAllUserInfo() {
        return this._userInfoMap.values();
    }

    getReadCount(chat: ChatLogged): number {
        let count = 0;

        if (this.userCount >= 100) return 0;

        for (const [ strId ] of this._userInfoMap) {
            const watermark = this._watermarkMap.get(strId);

            if (!watermark || watermark && watermark.greaterThanOrEqual(chat.logId)) count++;
        }

        return count;
    }

    getReaders(chat: ChatLogged): Readonly<NormalChannelUserInfo>[] {
        let list: NormalChannelUserInfo[] = [];

        if (this.userCount >= 100) return [];

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

    async setPushAlert(flag: boolean) {
        const res = await this._channelSession.setPushAlert(flag);

        if (res.success) {
            this._info = { ...this._info, pushAlert: flag };
        }

        return res;
    }

    async inviteUsers(users: ChannelUser[]) {
        const res = await this._channelSession.inviteUsers(users);

        if (res.success) {
            await this.getLatestUserInfo(...users);
        }

        return res;
    }

    syncChatList(endLogId: Long, startLogId?: Long) {
        return this._channelSession.syncChatList(endLogId, startLogId);
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
                    const wrapped = structToChannelUserInfo(struct);

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

    async getLatestUserInfo(...users: ChannelUser[]) {
        const infoRes = await this._channelSession.getLatestUserInfo(...users);

        if (infoRes.success) {
            const result = infoRes.result as NormalChannelUserInfo[];

            result.forEach(info => this._userInfoMap.set(info.userId.toString(), info));
        }

        return infoRes;
    }

    async getAllLatestUserInfo() {
        const infoRes = await this._channelSession.getAllLatestUserInfo();

        if (infoRes.success) {
            const userInfoMap = new Map();
            infoRes.result.map(info => userInfoMap.set(info.userId.toString(), info));

            this._userInfoMap = userInfoMap;
        }

        return infoRes;
    }

    createMediaDownloader(media: MediaComponent, type: ChatType) {
        return this._channelSession.createMediaDownloader(media, type);
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