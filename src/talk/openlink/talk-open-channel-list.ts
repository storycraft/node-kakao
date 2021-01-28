/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { TypedEmitter } from "tiny-typed-emitter";
import { Channel } from "../../channel/channel";
import { ChannelList } from "../../channel/channel-list";
import { TalkSession } from "../client";
import { EventContext } from "../../event/event-context";
import { OpenChannel } from "../../openlink/open-channel";
import { DefaultRes } from "../../request";
import { KnownDataStatusCode } from "../../request";
import { AsyncCommandResult } from "../../request";
import { ChannelListUpdater, TalkChannelListHandler } from "../channel/talk-channel-handler";
import { OpenChannelListEvents } from "../event/events";
import { Managed } from "../managed";
import { TalkOpenChannel } from "./talk-open-channel";
import { TalkOpenChannelListHandler } from "./talk-open-channel-handler";
import { OpenChannelManageSession, OpenLinkComponent, OpenLinkProfiles } from "../../openlink";
import { TalkOpenChannelManageSession } from "./talk-open-channel-session";

export class TalkOpenChannelList extends TypedEmitter<OpenChannelListEvents> implements Managed<OpenChannelListEvents>, OpenChannelManageSession, ChannelList<TalkOpenChannel> {

    private _handler: TalkChannelListHandler;
    private _openHandler: TalkOpenChannelListHandler;

    private _manageSession: TalkOpenChannelManageSession;

    private _map: Map<string, TalkOpenChannel>;

    constructor(private _session: TalkSession) {
        super();

        const infoUpdater: ChannelListUpdater<TalkOpenChannel> = {
            addChannel: (channel) => this.addChannel(channel),
            removeChannel: (channel) => this.delete(channel.channelId)
        };

        this._manageSession = new TalkOpenChannelManageSession(_session);

        this._handler = new TalkChannelListHandler(this, infoUpdater);
        this._openHandler = new TalkOpenChannelListHandler(this, infoUpdater);

        this._map = new Map();
    }

    get(channelId: Long) {
        return this._map.get(channelId.toString());
    }

    /**
     * Find open channel using linkId
     *
     * @param linkId
     */
    getByLinkId(linkId: Long) {
        for (const channel of this.all()) {
            if (channel.linkId.eq(linkId)) return channel;
        }
    }

    all() {
        return this._map.values();
    }

    get size() {
        return this._map.size;
    }

    private async addChannel(channel: Channel): AsyncCommandResult<TalkOpenChannel> {
        return this.addOpenChannel({ ...channel, linkId: Long.ZERO });
    }

    private async addOpenChannel(channel: OpenChannel): AsyncCommandResult<TalkOpenChannel> {
        const last = this.get(channel.channelId);
        if (last) return { success: true, status: KnownDataStatusCode.SUCCESS, result: last };

        const talkChannel = new TalkOpenChannel(channel, this._session);

        const res = await talkChannel.updateAll();
        if (!res.success) return res;

        this._map.set(channel.channelId.toString(), talkChannel);

        return { success: true, status: res.status, result: talkChannel };
    }

    private delete(channelId: Long) {
        const strId = channelId.toString();

        return this._map.delete(strId);
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<OpenChannelListEvents>) {
        const ctx = new EventContext<OpenChannelListEvents>(this, parentCtx);

        for (const channel of this._map.values()) {
            channel.pushReceived(method, data, ctx);
        }

        this._handler.pushReceived(method, data, parentCtx);
        this._openHandler.pushReceived(method, data, parentCtx);
    }

    leaveKicked(channel: OpenChannel) {
        return this._manageSession.leaveKicked(channel);
    }

    leaveChannel(channel: Channel) {
        return this._manageSession.leaveChannel(channel);
    }

    async joinChannel(link: OpenLinkComponent, profile: OpenLinkProfiles, passcode?: string): AsyncCommandResult<TalkOpenChannel> {
        const res = await this._manageSession.joinChannel(link, profile, passcode);

        if (!res.success) return res;

        return this.addOpenChannel(res.result);
    }

    /**
     * Initialize TalkChannelList using channelList.
     * @param session
     * @param channelList
     */
    static async initialize(talkChannelList: TalkOpenChannelList, channelList: OpenChannel[] = []) {
        talkChannelList._map.clear();

        await Promise.all(channelList.map(channel => talkChannelList.addOpenChannel(channel)));

        return talkChannelList;
    }

}