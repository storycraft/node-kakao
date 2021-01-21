/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelManageSession, ChannelTemplate } from "../../channel/channel-session";
import { CommandSession } from "../../network/request-session";
import { DefaultRes } from "../../packet/bson-data-codec";
import { KnownDataStatusCode } from "../../packet/status-code";
import { Managed } from "../managed";
import { TalkChannel, TalkOpenChannel } from "./talk-channel";
import { TalkChannelManageSession } from "./talk-channel-session";

/**
 * Manage session channels
 */
export class TalkChannelList implements ChannelManageSession, Managed {

    private _session: CommandSession;

    private _manageSession: TalkChannelManageSession;

    private _normalChannelMap: Map<string, TalkChannel>;
    private _openChannelMap: Map<string, TalkOpenChannel>;

    /**
     * Construct managed channel list and initialize using channelList if present.
     * @param session 
     * @param channelList 
     * @param openChannelList 
     */
    constructor(session: CommandSession) {
        this._session = session;
        this._manageSession = new TalkChannelManageSession(session);
        
        this._normalChannelMap = new Map();
        this._openChannelMap = new Map();
    }

    /**
     * Returns true if list instance is managing channel.
     * @param channelId 
     */
    contains(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.has(strId) || this._openChannelMap.has(strId);
    }

    private async addChannel(channel: Channel | OpenChannel) {
        let talkChannel: TalkChannel | TalkOpenChannel;
        if ('linkId' in channel) {
            talkChannel = new TalkOpenChannel(channel, this._session);
            this._openChannelMap.set(channel.channelId.toString(), talkChannel);
        } else {
            talkChannel = new TalkChannel(channel, this._session);
            this._normalChannelMap.set(channel.channelId.toString(), talkChannel);
        }

        await talkChannel.updateInfo();
    }
    
    private delete(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.delete(strId) || this._openChannelMap.delete(strId);
    }

    createChannel(template: ChannelTemplate) {
        return this._manageSession.createChannel(template);
    }

    createMemoChannel() {
        return this._manageSession.createMemoChannel();
    }

    async leaveChannel(channel: Channel, block?: boolean) {
        const res = await this._manageSession.leaveChannel(channel, block);

        if (res.status === KnownDataStatusCode.SUCCESS && this.contains(channel.channelId)) {
            this.delete(channel.channelId);
        }

        return res;
    }

    pushReceived(method: string, data: DefaultRes): void {
        for (const channel of this._normalChannelMap.values()) {
            channel.pushReceived(method, data);
        }

        for (const openChannel of this._openChannelMap.values()) {
            openChannel.pushReceived(method, data);
        }
    }

    /**
     * Initialize TalkChannelList using channelList.
     * @param session 
     * @param channelList 
     */
    static async initialize(session: CommandSession, channelList: (Channel | OpenChannel)[] = []): Promise<TalkChannelList> {
        const talkChannelList = new TalkChannelList(session);

        for (const channel of channelList) {
            talkChannelList.addChannel(channel);
        }

        await Promise.all(channelList.map(channel => {
            talkChannelList.addChannel(channel);
        }));

        return talkChannelList;
    }

}