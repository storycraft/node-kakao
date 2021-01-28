/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { TypedEmitter } from "tiny-typed-emitter";
import { Channel } from "../../channel/channel";
import { ChannelList } from "../../channel/channel-list";
import { NormalChannelManageSession, ChannelTemplate } from "../../channel/channel-session";
import { TalkSession } from "../client";
import { EventContext } from "../../event/event-context";
import { DefaultRes } from "../../request";
import { KnownDataStatusCode } from "../../request";
import { AsyncCommandResult } from "../../request";
import { NormalChannelListEvents } from "../event/events";
import { Managed } from "../managed";
import { TalkNormalChannel } from "./talk-normal-channel";
import { TalkChannelListHandler } from "./talk-channel-handler";
import { TalkChannelManageSession } from "./talk-channel-session";

/**
 * Manage session channels
 */
export class TalkNormalChannelList extends TypedEmitter<NormalChannelListEvents> implements ChannelList<TalkNormalChannel>, NormalChannelManageSession, Managed<NormalChannelListEvents> {

    private _handler: TalkChannelListHandler;

    private _manageSession: TalkChannelManageSession;

    private _map: Map<string, TalkNormalChannel>;

    /**
     * Construct managed normal channel list
     * @param session
     */
    constructor(private _session: TalkSession) {
        super();

        this._handler = new TalkChannelListHandler(this, {
            addChannel: (channel) => this.addChannel(channel),
            removeChannel: (channel) => this.delete(channel.channelId)
        });

        this._manageSession = new TalkChannelManageSession(_session);

        this._map = new Map();
    }

    get size() {
        return this._map.size;
    }

    get(channelId: Long) {
        const strId = channelId.toString();

        return this._map.get(strId);
    }

    all() {
        return this._map.values();
    }

    private async addChannel(channel: Channel): AsyncCommandResult<TalkNormalChannel> {
        const last = this.get(channel.channelId);
        if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

        const strId = channel.channelId.toString();

        const talkChannel = new TalkNormalChannel(channel, this._session);

        const res = await talkChannel.updateAll();
        if (!res.success) return res;

        this._map.set(strId, talkChannel);

        return { success: true, status: res.status, result: talkChannel };
    }

    private delete(channelId: Long) {
        const strId = channelId.toString();

        return this._map.delete(strId);
    }

    async createChannel(template: ChannelTemplate): AsyncCommandResult<TalkNormalChannel> {
        const res = await this._manageSession.createChannel(template);
        if (!res.success) return res;

        return this.addChannel(res.result);
    }

    async createMemoChannel(): AsyncCommandResult<TalkNormalChannel> {
        const res = await this._manageSession.createMemoChannel();
        if (!res.success) return res;

        return this.addChannel(res.result);
    }

    async leaveChannel(channel: Channel, block?: boolean) {
        const res = await this._manageSession.leaveChannel(channel, block);

        if (res.success) {
            this.delete(channel.channelId);
        }

        return res;
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<NormalChannelListEvents>): void {
        const ctx = new EventContext<NormalChannelListEvents>(this, parentCtx);

        for (const channel of this._map.values()) {
            channel.pushReceived(method, data, ctx);
        }

        this._handler.pushReceived(method, data, parentCtx);
    }

    /**
     * Initialize TalkChannelList using channelList.
     * @param session
     * @param channelList
     */
    static async initialize(talkChannelList: TalkNormalChannelList, channelList: Channel[] = []) {
        talkChannelList._map.clear();
        await Promise.all(channelList.map(channel => talkChannelList.addChannel(channel)));

        return talkChannelList;
    }

}